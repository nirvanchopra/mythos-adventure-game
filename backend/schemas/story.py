from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class StoryOptionsSchema(BaseModel):
    text: str
    node_id: Optional[int] = None
    required_item: Optional[str] = None
    consequence: Optional[str] = None


class StoryNodeBase(BaseModel):
    content: str
    is_ending: bool = Field(default=False, validation_alias="is_end_node")
    is_winning_ending: bool = False


class CompleteStoryNodeReponse(StoryNodeBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    options: List[StoryOptionsSchema] = []

    @field_validator("options", mode="before")
    @classmethod
    def _null_options_to_empty(cls, v):
        return v or []


class StoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    session_id: Optional[str] = None
    genre: Optional[str] = "Fantasy"
    difficulty: Optional[str] = "Adventurer"
    character_name: Optional[str] = "The Wanderer"
    character_class: Optional[str] = "Adventurer"


class CreateStoryRequest(BaseModel):
    theme: str
    genre: Optional[str] = "Fantasy"
    difficulty: Optional[str] = "Adventurer"
    character_name: Optional[str] = "The Wanderer"
    character_class: Optional[str] = "Adventurer"
    world_setting: Optional[str] = None


class CompleteStoryResponse(StoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    root_node: CompleteStoryNodeReponse
    all_nodes: Dict[int, CompleteStoryNodeReponse]
