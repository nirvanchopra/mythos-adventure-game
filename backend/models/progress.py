from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.db.database import Base


class PlayerProgress(Base):
    __tablename__ = "player_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False, index=True)
    current_node_id = Column(Integer, ForeignKey("story_nodes.id"), nullable=False)

    visited_node_ids = Column(JSON, default=list, nullable=False)
    inventory_snapshot = Column(JSON, default=list, nullable=False)
    
    is_completed = Column(Boolean, default=False, nullable=False)
    outcome = Column(String(20), default="in_progress", nullable=False)  # in_progress, win, loss
    checkpoint_name = Column(String(100), nullable=True)

    saved_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    story = relationship("Story")
    current_node = relationship("StoryNode")

    __table_args__ = (
        UniqueConstraint("user_id", "story_id", name="uq_user_story_progress"),
    )
