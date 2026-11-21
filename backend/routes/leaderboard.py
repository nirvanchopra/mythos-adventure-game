from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.db.database import get_db
from backend.models.user import User, PlayerProfile
from backend.models.social import Friendship
from backend.core.auth import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    avatar: str
    title: str
    level: int
    xp: int
    stories_completed: int
    multiplayer_wins: int
    favorite_genre: str


@router.get("/global", response_model=List[LeaderboardEntry])
def get_global_leaderboard(
    sort_by: str = Query("xp"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(PlayerProfile).join(User, PlayerProfile.user_id == User.id)

    if sort_by == "level":
        query = query.order_by(PlayerProfile.level.desc(), PlayerProfile.xp.desc())
    elif sort_by == "stories":
        query = query.order_by(PlayerProfile.stories_completed.desc(), PlayerProfile.xp.desc())
    elif sort_by == "wins":
        query = query.order_by(PlayerProfile.multiplayer_wins.desc(), PlayerProfile.xp.desc())
    else:
        query = query.order_by(PlayerProfile.xp.desc())

    profiles = query.offset(offset).limit(limit).all()

    results = []
    for idx, p in enumerate(profiles, start=offset + 1):
        u = p.user
        results.append(LeaderboardEntry(
            rank=idx,
            user_id=p.user_id,
            username=u.username if u else "Adventurer",
            avatar=p.avatar_url,
            title=p.title,
            level=p.level,
            xp=p.xp,
            stories_completed=p.stories_completed,
            multiplayer_wins=p.multiplayer_wins,
            favorite_genre=p.favorite_genre
        ))

    return results


@router.get("/friends", response_model=List[LeaderboardEntry])
def get_friends_leaderboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find all accepted friends IDs
    f1 = db.query(Friendship.friend_id).filter(Friendship.user_id == user.id, Friendship.status == "accepted").all()
    f2 = db.query(Friendship.user_id).filter(Friendship.friend_id == user.id, Friendship.status == "accepted").all()
    
    friend_ids = {f[0] for f in f1} | {f[0] for f in f2}
    friend_ids.add(user.id)  # Include current user

    profiles = (
        db.query(PlayerProfile)
        .filter(PlayerProfile.user_id.in_(friend_ids))
        .order_by(PlayerProfile.xp.desc())
        .all()
    )

    results = []
    for idx, p in enumerate(profiles, start=1):
        u = p.user
        results.append(LeaderboardEntry(
            rank=idx,
            user_id=p.user_id,
            username=u.username if u else "Adventurer",
            avatar=p.avatar_url,
            title=p.title,
            level=p.level,
            xp=p.xp,
            stories_completed=p.stories_completed,
            multiplayer_wins=p.multiplayer_wins,
            favorite_genre=p.favorite_genre
        ))

    return results
