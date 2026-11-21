import uuid

from datetime import datetime, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Cookie,
    Response,
    BackgroundTasks,
)

from sqlalchemy.orm import Session

from backend.db.database import get_db, SessionLocal
from backend.models.story import Story, StoryNode
from backend.models.jobs import StoryJob
from backend.core.story_generator import StoryGenerator
from backend.core.auth import get_optional_user
from backend.models.user import User

from backend.schemas.story import (
    CreateStoryRequest,
    CompleteStoryResponse,
    CompleteStoryNodeReponse,
)

from backend.schemas.jobs import StoryJobResponse


router = APIRouter(prefix="/stories", tags=["stories"])


def get_session_id(session_id: Optional[str] = Cookie(default=None)):
    if session_id is None:
        session_id = str(uuid.uuid4())
    return session_id


@router.post("/create", response_model=StoryJobResponse)
def create_story(
    request: CreateStoryRequest,
    background_tasks: BackgroundTasks,
    response: Response,
    db: Session = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user: Optional[User] = Depends(get_optional_user),
):
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )

    job_id = str(uuid.uuid4())
    user_id = current_user.id if current_user else None

    job = StoryJob(
        job_id=job_id,
        session_id=session_id,
        status="pending",
        theme=request.theme,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(
        generate_story,
        job_id=job_id,
        theme=request.theme,
        session_id=session_id,
        genre=request.genre or "Fantasy",
        difficulty=request.difficulty or "Adventurer",
        character_name=request.character_name or "The Wanderer",
        character_class=request.character_class or "Adventurer",
        world_setting=request.world_setting,
        user_id=user_id,
    )

    return job


def generate_story(
    job_id: str,
    theme: str,
    session_id: str,
    genre: str = "Fantasy",
    difficulty: str = "Adventurer",
    character_name: str = "The Wanderer",
    character_class: str = "Adventurer",
    world_setting: Optional[str] = None,
    user_id: Optional[int] = None
):
    db = SessionLocal()
    try:
        job = db.query(StoryJob).filter(StoryJob.job_id == job_id).first()
        if not job:
            return

        job.status = "processing"
        db.commit()

        try:
            story = StoryGenerator.generate_story(
                db=db,
                session_id=session_id,
                theme=theme,
                genre=genre,
                difficulty=difficulty,
                character_name=character_name,
                character_class=character_class,
                world_setting=world_setting,
                user_id=user_id
            )

            job.story_id = story.id
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

        except Exception as e:
            db.rollback()
            job = db.query(StoryJob).filter(StoryJob.job_id == job_id).first()
            if job:
                job.status = "failed"
                job.error = str(e)
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
    finally:
        db.close()


@router.get("/{storyid}/complete", response_model=CompleteStoryResponse)
def get_complete_story(
    storyid: int,
    db: Session = Depends(get_db),
    session_id: str = Depends(get_session_id),
):
    story = (
        db.query(Story)
        .filter(Story.id == storyid)
        .first()
    )

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    return build_complete_story_tree(db, story)


def build_complete_story_tree(db: Session, story: Story) -> CompleteStoryResponse:
    nodes = db.query(StoryNode).filter(StoryNode.story_id == story.id).all()

    node_dict = {
        node.id: CompleteStoryNodeReponse.model_validate(node) for node in nodes
    }

    root_node = next((n for n in nodes if n.is_root_node), None)
    if not root_node:
        raise HTTPException(status_code=500, detail="Story has no root node")

    return CompleteStoryResponse(
        id=story.id,
        title=story.title,
        session_id=story.session_id,
        created_at=story.created_at,
        root_node=node_dict[root_node.id],
        all_nodes=node_dict,
    )