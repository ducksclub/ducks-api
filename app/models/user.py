import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user, nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    poker_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    darts_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    billiard_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    registrations = relationship("EventRegistration", back_populates="user", cascade="all, delete-orphan")
    feedback_items = relationship("Feedback", back_populates="user")
