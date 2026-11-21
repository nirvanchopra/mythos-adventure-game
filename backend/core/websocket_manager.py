import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from fastapi import WebSocket
from sqlalchemy.orm import Session

from backend.models.multiplayer import MultiplayerRoom, RoomPlayer, RoomMessage
from backend.models.story import Story, StoryNode
from backend.models.user import User
from backend.services.progression import ProgressionService


class ConnectedClient:
    def __init__(self, websocket: WebSocket, user_id: int, username: str, avatar: str):
        self.websocket = websocket
        self.user_id = user_id
        self.username = username
        self.avatar = avatar


class WebSocketRoomManager:
    def __init__(self):
        # Maps room_code -> List[ConnectedClient]
        self.active_rooms: Dict[str, List[ConnectedClient]] = {}
        # Lock for thread safety during broadcasts and voting calculations
        self.lock = asyncio.Lock()

    async def connect(self, room_code: str, websocket: WebSocket, user: User) -> ConnectedClient:
        await websocket.accept()
        profile = user.profile
        avatar = profile.avatar_url if profile else "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80"
        
        client = ConnectedClient(
            websocket=websocket,
            user_id=user.id,
            username=user.username,
            avatar=avatar
        )

        async with self.lock:
            if room_code not in self.active_rooms:
                self.active_rooms[room_code] = []
            self.active_rooms[room_code].append(client)

        return client

    async def disconnect(self, room_code: str, client: ConnectedClient, db: Session):
        async with self.lock:
            if room_code in self.active_rooms:
                self.active_rooms[room_code] = [
                    c for c in self.active_rooms[room_code] if c.websocket != client.websocket
                ]
                if not self.active_rooms[room_code]:
                    del self.active_rooms[room_code]

        # Host migration check if remaining players exist
        room = db.query(MultiplayerRoom).filter(MultiplayerRoom.room_code == room_code).first()
        if room and room.host_user_id == client.user_id:
            remaining_player = db.query(RoomPlayer).filter(
                RoomPlayer.room_id == room.id,
                RoomPlayer.user_id != client.user_id
            ).first()
            if remaining_player:
                room.host_user_id = remaining_player.user_id
                remaining_player.is_host = True
                db.commit()
                await self.broadcast(room_code, {
                    "type": "host_migrated",
                    "new_host_id": remaining_player.user_id,
                    "new_host_username": remaining_player.user.username if remaining_player.user else "Adventurer"
                })

        await self.broadcast(room_code, {
            "type": "player_left",
            "user_id": client.user_id,
            "username": client.username
        })

    async def broadcast(self, room_code: str, message: dict):
        clients = self.active_rooms.get(room_code, [])
        for client in list(clients):
            try:
                await client.websocket.send_json(message)
            except Exception:
                # Disconnected client
                pass

    async def handle_message(
        self,
        room_code: str,
        client: ConnectedClient,
        data: dict,
        db: Session
    ):
        action = data.get("action")
        room = db.query(MultiplayerRoom).filter(MultiplayerRoom.room_code == room_code).first()
        if not room:
            return

        if action == "chat":
            text = (data.get("message") or "").strip()
            if text:
                msg = RoomMessage(
                    room_id=room.id,
                    sender_username=client.username,
                    text=text[:255]
                )
                db.add(msg)
                db.commit()
                await self.broadcast(room_code, {
                    "type": "chat_message",
                    "sender": client.username,
                    "text": text[:255],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

        elif action == "toggle_ready":
            player = db.query(RoomPlayer).filter(
                RoomPlayer.room_id == room.id,
                RoomPlayer.user_id == client.user_id
            ).first()
            if player:
                player.is_ready = not player.is_ready
                db.commit()
                await self.broadcast(room_code, {
                    "type": "player_ready_changed",
                    "user_id": client.user_id,
                    "is_ready": player.is_ready
                })

        elif action == "select_story":
            # Only host can pick the story
            if room.host_user_id == client.user_id:
                story_id = data.get("story_id")
                story = db.query(Story).filter(Story.id == story_id).first()
                if story:
                    room.story_id = story.id
                    db.commit()
                    await self.broadcast(room_code, {
                        "type": "story_selected",
                        "story_id": story.id,
                        "story_title": story.title,
                        "genre": story.genre
                    })

        elif action == "start_game":
            if room.host_user_id == client.user_id:
                # Fallback to finding latest story if none selected
                if not room.story_id:
                    fallback_story = db.query(Story).order_by(Story.id.desc()).first()
                    if fallback_story:
                        room.story_id = fallback_story.id

                if room.story_id:
                    root_node = db.query(StoryNode).filter(
                        StoryNode.story_id == room.story_id,
                        StoryNode.is_root_node == True
                    ).first()

                    if root_node:
                        room.status = "playing"
                        room.current_node_id = root_node.id
                        
                        # Reset all player votes
                        for p in room.players:
                            p.current_vote = None
                        db.commit()

                        await self.broadcast(room_code, {
                            "type": "game_started",
                            "story_title": room.story.title if room.story else "Multiplayer Quest",
                            "node": {
                                "id": root_node.id,
                                "content": root_node.content,
                                "is_ending": root_node.is_end_node,
                                "is_winning_ending": root_node.is_winning_ending,
                                "options": root_node.options or []
                            }
                        })

        elif action == "vote":
            target_node_id = data.get("target_node_id")
            player = db.query(RoomPlayer).filter(
                RoomPlayer.room_id == room.id,
                RoomPlayer.user_id == client.user_id
            ).first()

            if player and room.status == "playing":
                player.current_vote = target_node_id
                db.commit()

                # Tally votes in room
                active_players = room.players
                votes = {}
                voted_count = 0
                for p in active_players:
                    if p.current_vote is not None:
                        votes[p.current_vote] = votes.get(p.current_vote, 0) + 1
                        voted_count += 1

                await self.broadcast(room_code, {
                    "type": "vote_update",
                    "user_id": client.user_id,
                    "target_node_id": target_node_id,
                    "votes": votes,
                    "voted_count": voted_count,
                    "total_players": len(active_players)
                })

                # Check if all players in room voted (or quorum reached)
                if voted_count >= len(active_players):
                    # Resolve winner
                    winning_node_id = max(votes.keys(), key=lambda k: votes[k])
                    winning_node = db.query(StoryNode).filter(StoryNode.id == winning_node_id).first()

                    # Reward score for competitive mode players who voted for winner
                    if room.mode == "Competitive Race":
                        for p in active_players:
                            if p.current_vote == winning_node_id:
                                p.score += 50

                    room.current_node_id = winning_node_id
                    
                    # Reset votes for next turn
                    for p in active_players:
                        p.current_vote = None
                    db.commit()

                    if winning_node.is_end_node:
                        room.status = "ended"
                        db.commit()
                        
                        # Award multiplayer victory XP and coins to all party members!
                        is_win = winning_node.is_winning_ending
                        for p in active_players:
                            ProgressionService.grant_rewards(
                                db=db,
                                user_id=p.user_id,
                                xp_gain=150 if is_win else 75,
                                coin_gain=60 if is_win else 25,
                                source="multiplayer_victory",
                                description=f"Multiplayer expedition {'victory' if is_win else 'defeat'} in {room.title}"
                            )
                            # Increment player profile multiplayer wins if win
                            if is_win:
                                prof = p.user.profile
                                if prof:
                                    prof.multiplayer_wins += 1
                                    db.commit()

                        await self.broadcast(room_code, {
                            "type": "game_over",
                            "is_winning_ending": winning_node.is_winning_ending,
                            "content": winning_node.content,
                            "scores": {p.user.username: p.score for p in active_players if p.user}
                        })
                    else:
                        await self.broadcast(room_code, {
                            "type": "round_advanced",
                            "selected_node_id": winning_node_id,
                            "node": {
                                "id": winning_node.id,
                                "content": winning_node.content,
                                "is_ending": winning_node.is_end_node,
                                "is_winning_ending": winning_node.is_winning_ending,
                                "options": winning_node.options or []
                            },
                            "scores": {p.user.username: p.score for p in active_players if p.user}
                        })


ws_manager = WebSocketRoomManager()
