from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config import get_settings
from app.database.init_db import init_db
from app.database.session import SessionLocal
from app.models.event import Event, GameType
from app.models.user import UserRole
from app.schemas.user import UserCreate
from app.services.user_service import create_user, get_user_by_email


def seed() -> None:
    settings = get_settings()
    init_db()

    with SessionLocal() as db:
        admin = get_user_by_email(db, settings.default_admin_email)
        if admin is None:
            admin = create_user(
                db,
                UserCreate(email=settings.default_admin_email, password=settings.default_admin_password),
                role=UserRole.admin,
            )
            print(f"Created admin: {admin.email}")
        else:
            print(f"Admin already exists: {admin.email}")

        if db.scalar(select(Event).limit(1)) is None:
            now = datetime.now(timezone.utc)
            events = [
                Event(
                    title="Friday Poker Night",
                    description="Еженедельный покерный вечер DUCK'S для игроков любого уровня.",
                    game_type=GameType.poker,
                    starts_at=now + timedelta(days=3),
                    capacity=24,
                    points_reward=15,
                ),
                Event(
                    title="Darts Challenge",
                    description="Турнир по дартсу с короткой сеткой и быстрыми матчами.",
                    game_type=GameType.darts,
                    starts_at=now + timedelta(days=5),
                    capacity=32,
                    points_reward=10,
                ),
                Event(
                    title="Billiard League Round",
                    description="Раунд клубной лиги по бильярду с рейтинговыми очками.",
                    game_type=GameType.billiard,
                    starts_at=now + timedelta(days=7),
                    capacity=16,
                    points_reward=20,
                ),
            ]
            db.add_all(events)
            db.commit()
            print(f"Created events: {len(events)}")
        else:
            print("Events already exist, skipped")


if __name__ == "__main__":
    seed()
