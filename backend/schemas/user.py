from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


class PlayerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    avatar_url: str
    title: str
    level: int
    xp: int
    coins: int
    stories_completed: int
    multiplayer_wins: int
    favorite_genre: str
    inventory: List[Dict[str, Any]] = []
    achievements: List[Dict[str, Any]] = []
    stats: Dict[str, Any] = {}
    created_at: Optional[datetime] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None
    profile: Optional[PlayerProfileResponse] = None


class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    avatar_url: Optional[str] = None
    favorite_genre: Optional[str] = None
    title: Optional[str] = None
