from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.db.database import get_db
from backend.models.user import User, PlayerProfile
from backend.models.progression import RewardTransaction
from backend.core.auth import get_current_user
from backend.services.progression import ProgressionService
from backend.schemas.user import PlayerProfileResponse

router = APIRouter(prefix="/rewards", tags=["rewards"])


class UnlockAchievementRequest(BaseModel):
    achievement_code: str


class ClaimQuestRequest(BaseModel):
    quest_code: str


class StoryCompleteRewardRequest(BaseModel):
    story_id: int
    outcome: str = Field(description="'win' or 'loss'")


class StorePurchaseRequest(BaseModel):
    item_id: str
    item_name: str
    cost: int = Field(gt=0)
    category: str = "relic"
    description: Optional[str] = None


class RewardResultResponse(BaseModel):
    success: bool
    xp_gained: int
    coins_gained: int
    leveled_up: bool
    new_level: int
    new_coins: int
    profile: PlayerProfileResponse


@router.get("/achievements")
def list_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProgressionService.get_user_achievements(db, user.id)


@router.post("/achievements/unlock")
def unlock_achievement(
    request: UnlockAchievementRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ach, rewarded, profile = ProgressionService.unlock_achievement(db, user.id, request.achievement_code)
    return {
        "achievement": {
            "code": ach.code,
            "title": ach.title,
            "xp_reward": ach.xp_reward,
            "coin_reward": ach.coin_reward
        },
        "rewarded": rewarded,
        "profile": PlayerProfileResponse.model_validate(profile) if profile else None
    }


@router.get("/quests")
def list_quests(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quests = ProgressionService.get_or_create_user_quests(db, user.id)
    return [
        {
            "id": q.id,
            "quest_code": q.quest_code,
            "title": q.title,
            "description": q.description,
            "progress": q.progress,
            "target": q.target,
            "reward_xp": q.reward_xp,
            "reward_coins": q.reward_coins,
            "is_completed": q.is_completed,
            "is_claimed": q.is_claimed
        }
        for q in quests
    ]


@router.post("/quests/claim")
def claim_quest(
    request: ClaimQuestRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest, profile = ProgressionService.claim_quest(db, user.id, request.quest_code)
    return {
        "success": True,
        "quest_code": quest.quest_code,
        "reward_xp": quest.reward_xp,
        "reward_coins": quest.reward_coins,
        "profile": PlayerProfileResponse.model_validate(profile)
    }


@router.post("/story-complete", response_model=RewardResultResponse)
def reward_story_completion(
    request: StoryCompleteRewardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_win = request.outcome.lower() == "win"
    xp_gain = 120 if is_win else 60
    coin_gain = 50 if is_win else 20

    profile, leveled_up = ProgressionService.grant_rewards(
        db=db,
        user_id=user.id,
        xp_gain=xp_gain,
        coin_gain=coin_gain,
        source="story_completion",
        description=f"Completed story #{request.story_id} ({'Victory' if is_win else 'Defeat'})"
    )

    # Increment stories completed
    profile.stories_completed += 1
    db.commit()

    # Automatically trigger "First Adventure" achievement
    if profile.stories_completed == 1:
        ProgressionService.unlock_achievement(db, user.id, "first_adventure")
    elif profile.stories_completed >= 10:
        ProgressionService.unlock_achievement(db, user.id, "10_stories")

    profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user.id).first()

    return RewardResultResponse(
        success=True,
        xp_gained=xp_gain,
        coins_gained=coin_gain,
        leveled_up=leveled_up,
        new_level=profile.level,
        new_coins=profile.coins,
        profile=PlayerProfileResponse.model_validate(profile)
    )


@router.post("/store/purchase")
def purchase_store_item(
    request: StorePurchaseRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = ProgressionService.spend_coins(
        db=db,
        user_id=user.id,
        cost=request.cost,
        item_id=request.item_id,
        item_name=request.item_name,
        category=request.category,
        description=request.description or ""
    )
    return {
        "success": True,
        "item_id": request.item_id,
        "item_name": request.item_name,
        "remaining_coins": profile.coins,
        "inventory": profile.inventory
    }


@router.get("/transactions")
def get_reward_transactions(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txs = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.user_id == user.id)
        .order_by(RewardTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": tx.id,
            "amount_xp": tx.amount_xp,
            "amount_coins": tx.amount_coins,
            "type": tx.transaction_type,
            "source": tx.source,
            "description": tx.description,
            "created_at": tx.created_at
        }
        for tx in txs
    ]
