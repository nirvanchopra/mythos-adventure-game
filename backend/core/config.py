from pathlib import Path
from typing import List, Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):

    DATABASE_URL: str
    GROQ_API_KEY: str
    API_PREFIX: str = "/api"
    DEBUG: bool = False
    Allowed_origins: Annotated[List[str], NoDecode] = []
    OPENAPI_URL: str = "/openapi.json"
    JWT_SECRET_KEY: str = "mythos-super-secret-jwt-key-adventure-rpg-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("Allowed_origins", mode="before")
    @classmethod
    def split_allowed_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v


settings = Settings()