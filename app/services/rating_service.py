from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.event import GameType
from app.models.user import User
from app.schemas.rating import RatingItem


def get_rating(db: Session, game_type: GameType | None = None, limit: int = 50) -> list[RatingItem]:
    points_field = {
        GameType.poker: User.poker_points,
        GameType.darts: User.darts_points,
        GameType.billiard: User.billiard_points,
        None: User.total_points,
    }[game_type]

    users = db.scalars(select(User).order_by(desc(points_field), User.email.asc()).limit(limit)).all()
    return [RatingItem(user_id=user.id, email=user.email, points=getattr(user, points_field.key)) for user in users]
