from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.event import GameType


class EventBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10, max_length=2000)
    game_type: GameType
    starts_at: datetime
    capacity: int = Field(ge=1, le=200)
    points_reward: int = Field(default=10, ge=0, le=1000)


class EventCreate(EventBase):
    @field_validator("starts_at")
    @classmethod
    def starts_at_must_have_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("starts_at must include timezone, for example 2026-05-10T18:00:00+05:00")
        return value


class EventRead(EventBase):
    id: int
    registered_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RegistrationRead(BaseModel):
    event_id: int
    user_id: int
    status: str
