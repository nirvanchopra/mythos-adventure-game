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


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), default="Award", nullable=False)
    category = Column(String(50), default="story", nullable=False)
    xp_reward = Column(Integer, default=50, nullable=False)
    coin_reward = Column(Integer, default=25, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class PlayerAchievement(Base):
    __tablename__ = "player_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False, index=True)
    unlocked_at = Column(DateTime, server_default=func.now())

    achievement = relationship("Achievement")

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_player_achievement"),
    )


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount_xp = Column(Integer, default=0, nullable=False)
    amount_coins = Column(Integer, default=0, nullable=False)
    transaction_type = Column(String(20), default="earn", nullable=False)  # earn, spend
    source = Column(String(50), nullable=False)  # story_completion, daily_quest, achievement, store_purchase
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class PlayerQuest(Base):
    __tablename__ = "player_quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quest_code = Column(String(50), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    target = Column(Integer, default=1, nullable=False)
    reward_xp = Column(Integer, default=40, nullable=False)
    reward_coins = Column(Integer, default=20, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    is_claimed = Column(Boolean, default=False, nullable=False)
    claimed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
