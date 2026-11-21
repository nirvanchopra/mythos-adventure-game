
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    JSON,
    Boolean,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.db.database import Base


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    content = Column(JSON, nullable=False)

    session_id = Column(String(36), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    genre = Column(String(50), default="Fantasy", nullable=False)
    difficulty = Column(String(50), default="Adventurer", nullable=False)
    character_name = Column(String(100), default="The Wanderer", nullable=False)
    character_class = Column(String(100), default="Adventurer", nullable=False)
    world_setting = Column(String(255), nullable=True)
    play_count = Column(Integer, default=0, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    author = relationship(
        "User",
        back_populates="stories"
    )

    nodes = relationship(
        "StoryNode",
        back_populates="story",
        cascade="all, delete-orphan"
    )


class StoryNode(Base):
    __tablename__ = "story_nodes"

    id = Column(Integer, primary_key=True, index=True)

    story_id = Column(
        Integer,
        ForeignKey("stories.id"),
        nullable=False
    )

    content = Column(String, nullable=False)

    is_root_node = Column(Boolean, default=False)
    is_winning_ending = Column(Boolean, default=False)
    is_end_node = Column(Boolean, default=False)

    options = Column(JSON, nullable=True)

    parent_node_id = Column(
        Integer,
        ForeignKey("story_nodes.id"),
        nullable=True
    )

    story = relationship(
        "Story",
        back_populates="nodes"
    )

    parent_node = relationship(
        "StoryNode",
        remote_side=[id],
        back_populates="child_nodes"
    )

    child_nodes = relationship(
        "StoryNode",
        back_populates="parent_node"
    )
