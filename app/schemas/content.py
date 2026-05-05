from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RuleItem(BaseModel):
    title: str
    text: str


class FAQItem(BaseModel):
    question: str
    answer: str


class FeedbackCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    contact: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=10, max_length=2000)


class FeedbackRead(BaseModel):
    id: int
    user_id: int | None
    name: str
    contact: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
