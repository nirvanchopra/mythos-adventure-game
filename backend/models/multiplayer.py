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


class MultiplayerRoom(Base):
    __tablename__ = "multiplayer_rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(8), unique=True, nullable=False, index=True)
    title = Column(String(100), nullable=False)
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    mode = Column(String(30), default="Shared Voting", nullable=False)  # "Shared Voting", "Competitive Race"
    status = Column(String(20), default="lobby", nullable=False)  # "lobby", "playing", "ended"
    max_players = Column(Integer, default=4, nullable=False)
    is_private = Column(Boolean, default=False, nullable=False)
    passcode = Column(String(20), nullable=True)

    story_id = Column(Integer, ForeignKey("stories.id"), nullable=True)
    current_node_id = Column(Integer, ForeignKey("story_nodes.id"), nullable=True)
    voting_deadline = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    host = relationship("User", foreign_keys=[host_user_id])
    story = relationship("Story", foreign_keys=[story_id])
    players = relationship("RoomPlayer", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("RoomMessage", back_populates="room", cascade="all, delete-orphan")


class RoomPlayer(Base):
    __tablename__ = "room_players"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("multiplayer_rooms.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    is_ready = Column(Boolean, default=False, nullable=False)
    is_host = Column(Boolean, default=False, nullable=False)
    score = Column(Integer, default=0, nullable=False)
    current_vote = Column(Integer, nullable=True)
    
    joined_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
    room = relationship("MultiplayerRoom", back_populates="players")

    __table_args__ = (
        UniqueConstraint("room_id", "user_id", name="uq_room_user"),
    )


class RoomMessage(Base):
    __tablename__ = "room_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("multiplayer_rooms.id"), nullable=False, index=True)
    sender_username = Column(String(50), nullable=False)
    text = Column(String(255), nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    room = relationship("MultiplayerRoom", back_populates="messages")
