from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.db.database import get_db
from backend.models.user import User, PlayerProfile
from backend.models.social import Friendship, ActivityFeedItem
from backend.core.auth import get_current_user

router = APIRouter(prefix="/social", tags=["social"])


class FriendActionRequest(BaseModel):
    friend_id: int


class FriendResponseAction(BaseModel):
    friendship_id: int
    action: str  # "accept" or "decline"


class PlayerSummary(BaseModel):
    user_id: int
    username: str
    avatar: str
    title: str
    level: int
    favorite_genre: str


@router.get("/search", response_model=List[PlayerSummary])
def search_players(
    q: str = Query(min_length=1, max_length=50),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    users = (
        db.query(User)
        .filter(User.username.ilike(f"%{q}%"))
        .limit(limit)
        .all()
    )

    results = []
    for u in users:
        prof = u.profile
        results.append(PlayerSummary(
            user_id=u.id,
            username=u.username,
            avatar=prof.avatar_url if prof else "",
            title=prof.title if prof else "Adventurer",
            level=prof.level if prof else 1,
            favorite_genre=prof.favorite_genre if prof else "Fantasy"
        ))
    return results


@router.get("/profile/{username_or_id}")
def get_public_profile(
    username_or_id: str,
    db: Session = Depends(get_db)
):
    user = None
    if username_or_id.isdigit():
        user = db.query(User).filter(User.id == int(username_or_id)).first()
    if not user:
        user = db.query(User).filter(User.username.ilike(username_or_id)).first()

    if not user:
        raise HTTPException(status_code=404, detail="Adventurer not found")

    prof = user.profile
    return {
        "user_id": user.id,
        "username": user.username,
        "avatar": prof.avatar_url if prof else "",
        "title": prof.title if prof else "Novice Wanderer",
        "level": prof.level if prof else 1,
        "xp": prof.xp if prof else 0,
        "stories_completed": prof.stories_completed if prof else 0,
        "multiplayer_wins": prof.multiplayer_wins if prof else 0,
        "favorite_genre": prof.favorite_genre if prof else "Fantasy",
        "achievements_count": len(prof.achievements or []) if prof else 0,
        "member_since": user.created_at.isoformat() if user.created_at else None
    }


@router.post("/friends/request")
def send_friend_request(
    request: FriendActionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.id == request.friend_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")

    target = db.query(User).filter(User.id == request.friend_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target adventurer not found")

    # Check for existing friendship or request
    existing = db.query(Friendship).filter(
        ((Friendship.user_id == user.id) & (Friendship.friend_id == request.friend_id)) |
        ((Friendship.user_id == request.friend_id) & (Friendship.friend_id == user.id))
    ).first()

    if existing:
        if existing.status == "accepted":
            return {"message": "Already friends with this adventurer"}
        elif existing.status == "pending":
            return {"message": "Friend request already pending"}

    friendship = Friendship(
        user_id=user.id,
        friend_id=request.friend_id,
        status="pending"
    )
    db.add(friendship)
    db.commit()

    return {"success": True, "message": f"Friend request sent to {target.username}"}


@router.post("/friends/respond")
def respond_friend_request(
    request: FriendResponseAction,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friendship = db.query(Friendship).filter(
        Friendship.id == request.friendship_id,
        Friendship.friend_id == user.id
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    if request.action == "accept":
        friendship.status = "accepted"
        db.commit()
        return {"success": True, "message": "Friend request accepted"}
    else:
        friendship.status = "declined"
        db.commit()
        return {"success": True, "message": "Friend request declined"}


@router.get("/friends")
def list_friends(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Accepted friends
    f_accepted = db.query(Friendship).filter(
        ((Friendship.user_id == user.id) | (Friendship.friend_id == user.id)),
        Friendship.status == "accepted"
    ).all()

    friends = []
    for f in f_accepted:
        friend_user = f.receiver if f.user_id == user.id else f.sender
        prof = friend_user.profile
        friends.append({
            "friendship_id": f.id,
            "user_id": friend_user.id,
            "username": friend_user.username,
            "avatar": prof.avatar_url if prof else "",
            "title": prof.title if prof else "Adventurer",
            "level": prof.level if prof else 1
        })

    # Pending requests received
    f_pending = db.query(Friendship).filter(
        Friendship.friend_id == user.id,
        Friendship.status == "pending"
    ).all()

    incoming_requests = []
    for f in f_pending:
        sender_user = f.sender
        prof = sender_user.profile
        incoming_requests.append({
            "friendship_id": f.id,
            "user_id": sender_user.id,
            "username": sender_user.username,
            "avatar": prof.avatar_url if prof else "",
            "level": prof.level if prof else 1
        })

    return {
        "friends": friends,
        "incoming_requests": incoming_requests
    }


@router.get("/feed")
def get_activity_feed(
    limit: int = 15,
    db: Session = Depends(get_db)
):
    items = (
        db.query(ActivityFeedItem)
        .order_by(ActivityFeedItem.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": i.id,
            "username": i.user.username if i.user else "Adventurer",
            "avatar": i.user.profile.avatar_url if i.user and i.user.profile else "",
            "activity_type": i.activity_type,
            "title": i.title,
            "description": i.description,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in items
    ]
