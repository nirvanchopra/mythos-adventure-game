
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from backend.db.database import Base


class StoryJob(Base):
    __tablename__ = "story_jobs"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        String(36),
        unique=True,
        nullable=False,
        index=True
    )

    session_id = Column(
        String(36),
        nullable=False,
        index=True
    )

    theme = Column(String, nullable=False)

    story_id = Column(
        Integer,
        ForeignKey("stories.id"),
        nullable=True
    )

    status = Column(
        String,
        default="pending",
        nullable=False
    )

    error = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    completed_at = Column(DateTime, nullable=True)
