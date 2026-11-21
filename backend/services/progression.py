from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.user import User, PlayerProfile
from backend.models.progression import (
    Achievement,
    PlayerAchievement,
    RewardTransaction,
    PlayerQuest
)

DEFAULT_ACHIEVEMENTS = [
    {
        "code": "first_adventure",
        "title": "First Adventure",
        "description": "Begin your very first interactive story.",
        "icon": "Compass",
        "category": "story",
        "xp_reward": 50,
        "coin_reward": 25
    },
    {
        "code": "mystery_solver",
        "title": "Mystery Solver",
        "description": "Reach a winning ending in a Mystery adventure.",
        "icon": "Search",
        "category": "story",
        "xp_reward": 150,
        "coin_reward": 75
    },
    {
        "code": "master_of_choices",
        "title": "Master of Choices",
        "description": "Make 25 impactful decisions across branching sagas.",
        "icon": "GitFork",
        "category": "mastery",
        "xp_reward": 200,
        "coin_reward": 100
    },
    {
        "code": "10_stories",
        "title": "Story Hoarder",
        "description": "Complete 10 different stories in your career.",
        "icon": "BookOpen",
        "category": "story",
        "xp_reward": 500,
        "coin_reward": 250
    },
    {
        "code": "hidden_ending",
        "title": "Ending Hunter",
        "description": "Discover an elusive hidden ending path.",
        "icon": "Eye",
        "category": "mastery",
        "xp_reward": 300,
        "coin_reward": 150
    },
    {
        "code": "multiplayer_champion",
        "title": "Multiplayer Champion",
        "description": "Win a competitive multiplayer adventure session.",
        "icon": "Trophy",
        "category": "multiplayer",
        "xp_reward": 400,
        "coin_reward": 200
    },
    {
        "code": "legendary_explorer",
        "title": "Legendary Explorer",
        "description": "Reach Level 10 and conquer 5 different genres.",
        "icon": "Crown",
        "category": "mastery",
        "xp_reward": 1000,
        "coin_reward": 500
    }
]

DEFAULT_QUESTS = [
    {
        "quest_code": "daily_explore",
        "title": "Daily Chronicler",
        "description": "Play at least 1 story node today.",
        "progress": 1,
        "target": 1,
        "reward_xp": 40,
        "reward_coins": 20,
        "is_completed": True
    },
    {
        "quest_code": "genre_dive",
        "title": "Sci-Fi Pioneer",
        "description": "Complete an adventure in the Sci-Fi genre.",
        "progress": 0,
        "target": 1,
        "reward_xp": 100,
        "reward_coins": 50,
        "is_completed": False
    },
    {
        "quest_code": "decision_maker",
        "title": "Crossroads Wanderer",
        "description": "Make 5 decisions in branching stories.",
        "progress": 3,
        "target": 5,
        "reward_xp": 80,
        "reward_coins": 35,
        "is_completed": False
    }
]


def ensure_catalog_seeded(db: Session):
    for ach_data in DEFAULT_ACHIEVEMENTS:
        exists = db.query(Achievement).filter(Achievement.code == ach_data["code"]).first()
        if not exists:
            db.add(Achievement(**ach_data))
    db.commit()


def calculate_level_from_xp(total_xp: int) -> Tuple[int, int, str]:
    """Returns (level, xp_needed_for_next_level, rank_title)."""
    # Level formula: level = floor(sqrt(XP / 50)) + 1
    import math
    level = math.floor(math.sqrt(max(0, total_xp) / 50)) + 1
    next_level_xp = (level ** 2) * 50

    if level >= 10:
        title = "Legendary Storyteller"
    elif level >= 7:
        title = "Master Explorer"
    elif level >= 4:
        title = "Story Seeker"
    elif level >= 2:
        title = "Adventurer"
    else:
        title = "Beginner Explorer"

    return level, next_level_xp, title


class ProgressionService:

    @classmethod
    def grant_rewards(
        cls,
        db: Session,
        user_id: int,
        xp_gain: int,
        coin_gain: int,
        source: str,
        description: str
    ) -> Tuple[PlayerProfile, bool]:
        """Atomically grants XP and Coins, validates level advancement, and records transaction."""
        profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Player profile not found")

        old_level = profile.level
        new_xp = profile.xp + max(0, xp_gain)
        new_coins = profile.coins + max(0, coin_gain)

        new_level, _, rank_title = calculate_level_from_xp(new_xp)
        leveled_up = new_level > old_level

        profile.xp = new_xp
        profile.coins = new_coins
        profile.level = new_level
        profile.title = rank_title

        # Record server-side ledger transaction
        tx = RewardTransaction(
            user_id=user_id,
            amount_xp=xp_gain,
            amount_coins=coin_gain,
            transaction_type="earn",
            source=source,
            description=description
        )
        db.add(tx)
        db.commit()
        db.refresh(profile)

        return profile, leveled_up

    @classmethod
    def spend_coins(
        cls,
        db: Session,
        user_id: int,
        cost: int,
        item_id: str,
        item_name: str,
        category: str,
        description: str
    ) -> PlayerProfile:
        """Validates that player has enough coins, deducts balance, and adds item to inventory."""
        profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Player profile not found")

        if profile.coins < cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient coins! Required {cost}, but current balance is {profile.coins}."
            )

        # Deduct coins safely
        profile.coins -= cost

        # Add item to inventory (avoid duplicates for unique items)
        current_inv = list(profile.inventory or [])
        already_owned = any(i.get("id") == item_id for i in current_inv)
        if not already_owned:
            current_inv.append({
                "id": item_id,
                "name": item_name,
                "category": category,
                "description": description
            })
            profile.inventory = current_inv

        # Record spend transaction
        tx = RewardTransaction(
            user_id=user_id,
            amount_xp=0,
            amount_coins=-cost,
            transaction_type="spend",
            source="store_purchase",
            description=f"Purchased {item_name} for {cost} Gold"
        )
        db.add(tx)
        db.commit()
        db.refresh(profile)

        return profile

    @classmethod
    def unlock_achievement(
        cls,
        db: Session,
        user_id: int,
        achievement_code: str
    ) -> Tuple[Achievement, bool, Optional[PlayerProfile]]:
        """Unlocks achievement if not already claimed and awards XP/Coins atomically."""
        ensure_catalog_seeded(db)

        achievement = db.query(Achievement).filter(Achievement.code == achievement_code).first()
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement does not exist in realm")

        # Check for existing unlock to prevent duplicate rewards
        existing = db.query(PlayerAchievement).filter(
            PlayerAchievement.user_id == user_id,
            PlayerAchievement.achievement_id == achievement.id
        ).first()

        if existing:
            # Already unlocked, no duplicate rewards
            return achievement, False, None

        # Record unlock
        unlock_record = PlayerAchievement(
            user_id=user_id,
            achievement_id=achievement.id
        )
        db.add(unlock_record)
        db.flush()

        # Grant associated XP and Coins
        profile, _ = cls.grant_rewards(
            db=db,
            user_id=user_id,
            xp_gain=achievement.xp_reward,
            coin_gain=achievement.coin_reward,
            source="achievement",
            description=f"Unlocked Achievement: {achievement.title}"
        )

        return achievement, True, profile

    @classmethod
    def get_user_achievements(cls, db: Session, user_id: int) -> List[Dict[str, Any]]:
        ensure_catalog_seeded(db)
        achievements = db.query(Achievement).all()
        user_unlocks = {
            pa.achievement_id: pa.unlocked_at 
            for pa in db.query(PlayerAchievement).filter(PlayerAchievement.user_id == user_id).all()
        }

        result = []
        for ach in achievements:
            unlocked_at = user_unlocks.get(ach.id)
            result.append({
                "id": ach.id,
                "code": ach.code,
                "title": ach.title,
                "description": ach.description,
                "icon": ach.icon,
                "category": ach.category,
                "xp_reward": ach.xp_reward,
                "coin_reward": ach.coin_reward,
                "unlocked": unlocked_at is not None,
                "unlocked_at": unlocked_at
            })
        return result

    @classmethod
    def get_or_create_user_quests(cls, db: Session, user_id: int) -> List[PlayerQuest]:
        quests = db.query(PlayerQuest).filter(PlayerQuest.user_id == user_id).all()
        if not quests:
            for q_data in DEFAULT_QUESTS:
                q = PlayerQuest(user_id=user_id, **q_data)
                db.add(q)
            db.commit()
            quests = db.query(PlayerQuest).filter(PlayerQuest.user_id == user_id).all()
        return quests

    @classmethod
    def claim_quest(cls, db: Session, user_id: int, quest_code: str) -> Tuple[PlayerQuest, PlayerProfile]:
        quest = db.query(PlayerQuest).filter(
            PlayerQuest.user_id == user_id,
            PlayerQuest.quest_code == quest_code
        ).first()

        if not quest:
            raise HTTPException(status_code=404, detail="Quest not found")

        if not quest.is_completed:
            raise HTTPException(status_code=400, detail="Quest objective not yet completed")

        if quest.is_claimed:
            raise HTTPException(status_code=400, detail="Bounty already claimed")

        quest.is_claimed = True
        db.flush()

        profile, _ = cls.grant_rewards(
            db=db,
            user_id=user_id,
            xp_gain=quest.reward_xp,
            coin_gain=quest.reward_coins,
            source="daily_quest",
            description=f"Claimed Daily Quest: {quest.title}"
        )

        return quest, profile
