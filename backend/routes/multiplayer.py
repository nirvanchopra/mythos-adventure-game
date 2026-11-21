import random
import string
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.db.database import get_db, SessionLocal
from backend.models.user import User
from backend.models.story import Story
from backend.models.multiplayer import MultiplayerRoom, RoomPlayer, RoomMessage
from backend.core.auth import get_current_user
from backend.core.security import decode_access_token
from backend.core.websocket_manager import ws_manager

router = APIRouter(prefix="/multiplayer", tags=["multiplayer"])


class CreateRoomRequest(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    mode: str = "Shared Voting"  # "Shared Voting", "Competitive Race"
    max_players: int = Field(default=4, ge=2, le=8)
    is_private: bool = False
    passcode: Optional[str] = None
    story_id: Optional[int] = None


class JoinRoomRequest(BaseModel):
    passcode: Optional[str] = None


def generate_room_code(db: Session) -> str:
    for _ in range(20):
        chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        exists = db.query(MultiplayerRoom).filter(MultiplayerRoom.room_code == chars).first()
        if not exists:
            return chars
    return "MTH" + str(random.randint(100, 999))


@router.post("/rooms/create")
def create_room(
    request: CreateRoomRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code = generate_room_code(db)
    
    room = MultiplayerRoom(
        room_code=code,
        title=request.title,
        host_user_id=user.id,
        mode=request.mode,
        max_players=request.max_players,
        is_private=request.is_private,
        passcode=request.passcode,
        story_id=request.story_id,
        status="lobby"
    )
    db.add(room)
    db.flush()

    # Add host as player
    player = RoomPlayer(
        room_id=room.id,
        user_id=user.id,
        is_ready=True,
        is_host=True
    )
    db.add(player)
    db.commit()
    db.refresh(room)

    return {
        "success": True,
        "room_code": room.room_code,
        "title": room.title,
        "mode": room.mode,
        "max_players": room.max_players,
        "is_host": True
    }


@router.get("/rooms")
def list_open_rooms(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    rooms = (
        db.query(MultiplayerRoom)
        .filter(MultiplayerRoom.status != "ended")
        .order_by(MultiplayerRoom.created_at.desc())
        .limit(limit)
        .all()
    )

    results = []
    for r in rooms:
        host_user = r.host
        results.append({
            "code": r.room_code,
            "room_code": r.room_code,
            "title": r.title,
            "host": host_user.username if host_user else "Adventurer",
            "mode": r.mode,
            "status": r.status,
            "players": len(r.players),
            "max_players": r.max_players,
            "is_private": r.is_private,
            "genre": r.story.genre if r.story else "Fantasy"
        })
    return results


@router.get("/rooms/{room_code}")
def get_room_details(
    room_code: str,
    db: Session = Depends(get_db)
):
    room = db.query(MultiplayerRoom).filter(MultiplayerRoom.room_code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room chamber does not exist")

    players_info = []
    for p in room.players:
        u = p.user
        prof = u.profile if u else None
        players_info.append({
            "user_id": p.user_id,
            "username": u.username if u else "Player",
            "avatar": prof.avatar_url if prof else "",
            "level": prof.level if prof else 1,
            "is_ready": p.is_ready,
            "is_host": p.is_host,
            "score": p.score
        })

    messages_info = [
        {
            "id": m.id,
            "sender": m.sender_username,
            "text": m.text,
            "is_system": m.is_system,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in room.messages[-30:]
    ]

    return {
        "room_code": room.room_code,
        "title": room.title,
        "mode": room.mode,
        "status": room.status,
        "max_players": room.max_players,
        "is_private": room.is_private,
        "story_id": room.story_id,
        "current_node_id": room.current_node_id,
        "players": players_info,
        "messages": messages_info
    }


@router.post("/rooms/{room_code}/join")
def join_room(
    room_code: str,
    request: JoinRoomRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(MultiplayerRoom).filter(MultiplayerRoom.room_code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room.status == "ended":
        raise HTTPException(status_code=400, detail="This adventure chamber has ended")

    if room.is_private and room.passcode and room.passcode != request.passcode:
        raise HTTPException(status_code=403, detail="Invalid chamber passcode")

    # Check if already joined
    existing_player = db.query(RoomPlayer).filter(
        RoomPlayer.room_id == room.id,
        RoomPlayer.user_id == user.id
    ).first()

    if not existing_player:
        if len(room.players) >= room.max_players:
            raise HTTPException(status_code=400, detail="Chamber is at maximum capacity")

        new_player = RoomPlayer(
            room_id=room.id,
            user_id=user.id,
            is_ready=False,
            is_host=False
        )
        db.add(new_player)
        db.commit()

    return {
        "success": True,
        "room_code": room.room_code,
        "title": room.title,
        "mode": room.mode
    }


@router.websocket("/ws/{room_code}")
async def room_websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    token: Optional[str] = Query(None)
):
    db = SessionLocal()
    client = None
    try:
        # Authenticate user from query token
        user = None
        if token:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.id == int(payload["sub"])).first()

        if not user:
            # Fallback guest user for websocket connection
            user = db.query(User).first()
            if not user:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return

        client = await ws_manager.connect(room_code.upper(), websocket, user)

        # Broadcast initial room state
        room = db.query(MultiplayerRoom).filter(MultiplayerRoom.room_code == room_code.upper()).first()
        if room:
            await ws_manager.broadcast(room_code.upper(), {
                "type": "player_joined",
                "user_id": user.id,
                "username": user.username,
                "avatar": user.profile.avatar_url if user.profile else ""
            })

        while True:
            data = await websocket.receive_json()
            await ws_manager.handle_message(room_code.upper(), client, data, db)

    except WebSocketDisconnect:
        if client:
            await ws_manager.disconnect(room_code.upper(), client, db)
    finally:
        db.close()
