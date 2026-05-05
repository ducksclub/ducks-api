from pydantic import BaseModel, EmailStr


class RatingItem(BaseModel):
    user_id: int
    email: EmailStr
    points: int
