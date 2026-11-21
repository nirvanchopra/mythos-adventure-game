from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.db.database import get_db
from backend.models.user import User
from backend.models.story import Story, StoryNode
from backend.models.progress import PlayerProgress
from backend.core.auth import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


class SaveProgressRequest(BaseModel):
    story_id: int
    current_node_id: int
    visited_node_ids: List[int] = []
    inventory_snapshot: List[Dict[str, Any]] = []
    is_completed: bool = False
    outcome: Optional[str] = "in_progress"
    checkpoint_name: Optional[str] = None


class ProgressResponse(BaseModel):
    id: int
    story_id: int
    story_title: str
    genre: str
    current_node_id: int
    visited_node_ids: List[int]
    inventory_snapshot: List[Dict[str, Any]]
    is_completed: bool
    outcome: str
    checkpoint_name: Optional[str] = None


@router.post("/save")
def save_progress(
    request: SaveProgressRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify story and node exist
    story = db.query(Story).filter(Story.id == request.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    node = db.query(StoryNode).filter(
        StoryNode.id == request.current_node_id,
        StoryNode.story_id == request.story_id
    ).first()
    if not node:
        raise HTTPException(status_code=400, detail="Invalid node for this story")

    progress = db.query(PlayerProgress).filter(
        PlayerProgress.user_id == user.id,
        PlayerProgress.story_id == request.story_id
    ).first()

    if not progress:
        progress = PlayerProgress(
            user_id=user.id,
            story_id=request.story_id,
            current_node_id=request.current_node_id,
            visited_node_ids=request.visited_node_ids,
            inventory_snapshot=request.inventory_snapshot,
            is_completed=request.is_completed,
            outcome=request.outcome or "in_progress",
            checkpoint_name=request.checkpoint_name or f"Checkpoint at Node {request.current_node_id}"
        )
        db.add(progress)
    else:
        progress.current_node_id = request.current_node_id
        progress.visited_node_ids = request.visited_node_ids
        progress.inventory_snapshot = request.inventory_snapshot
        progress.is_completed = request.is_completed
        progress.outcome = request.outcome or progress.outcome
        if request.checkpoint_name:
            progress.checkpoint_name = request.checkpoint_name

    db.commit()
    db.refresh(progress)

    return {
        "success": True,
        "message": "Adventure progress checkpoint saved",
        "story_id": progress.story_id,
        "current_node_id": progress.current_node_id,
        "is_completed": progress.is_completed
    }


@router.get("/{story_id}")
def get_story_progress(
    story_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = db.query(PlayerProgress).filter(
        PlayerProgress.user_id == user.id,
        PlayerProgress.story_id == story_id
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="No saved progress found for this story")

    return {
        "story_id": progress.story_id,
        "current_node_id": progress.current_node_id,
        "visited_node_ids": progress.visited_node_ids,
        "inventory_snapshot": progress.inventory_snapshot,
        "is_completed": progress.is_completed,
        "outcome": progress.outcome,
        "checkpoint_name": progress.checkpoint_name,
        "saved_at": progress.saved_at
    }


@router.get("/")
@router.get("/user/saves")
def list_player_saved_adventures(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_progress = (
        db.query(PlayerProgress)
        .filter(PlayerProgress.user_id == user.id)
        .order_by(PlayerProgress.saved_at.desc())
        .all()
    )

    results = []
    for p in all_progress:
        story = p.story
        results.append({
            "story_id": p.story_id,
            "title": story.title if story else "Unknown Adventure",
            "genre": story.genre if story else "Fantasy",
            "current_node_id": p.current_node_id,
            "is_completed": p.is_completed,
            "outcome": p.outcome,
            "saved_at": p.saved_at,
            "checkpoint_name": p.checkpoint_name
        })

    return results


@router.delete("/{story_id}")
def delete_story_checkpoint(
    story_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = db.query(PlayerProgress).filter(
        PlayerProgress.user_id == user.id,
        PlayerProgress.story_id == story_id
    ).first()

    if progress:
        db.delete(progress)
        db.commit()

    return {"message": "Checkpoint erased. Ready to start adventure anew."}
