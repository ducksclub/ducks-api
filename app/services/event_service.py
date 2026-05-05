from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.event import Event, GameType
from app.models.registration import EventRegistration
from app.models.user import User
from app.schemas.event import EventCreate


def list_events(db: Session, game_type: GameType | None = None) -> list[Event]:
    statement = select(Event).order_by(Event.starts_at.asc())
    if game_type is not None:
        statement = statement.where(Event.game_type == game_type)
    return list(db.scalars(statement).all())


def get_event(db: Session, event_id: int) -> Event:
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


def create_event(db: Session, payload: EventCreate) -> Event:
    event = Event(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def count_registrations(db: Session, event_id: int) -> int:
    return db.scalar(select(func.count()).select_from(EventRegistration).where(EventRegistration.event_id == event_id)) or 0


def register_for_event(db: Session, event_id: int, user: User) -> EventRegistration:
    event = get_event(db, event_id)
    existing = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already registered for this event")

    if count_registrations(db, event_id) >= event.capacity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is full")

    registration = EventRegistration(event_id=event.id, user_id=user.id)
    user.total_points += event.points_reward
    if event.game_type == GameType.poker:
        user.poker_points += event.points_reward
    elif event.game_type == GameType.darts:
        user.darts_points += event.points_reward
    elif event.game_type == GameType.billiard:
        user.billiard_points += event.points_reward

    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


def cancel_registration(db: Session, event_id: int, user: User) -> None:
    event = get_event(db, event_id)
    registration = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user.id,
        )
    )
    if registration is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    user.total_points = max(0, user.total_points - event.points_reward)
    if event.game_type == GameType.poker:
        user.poker_points = max(0, user.poker_points - event.points_reward)
    elif event.game_type == GameType.darts:
        user.darts_points = max(0, user.darts_points - event.points_reward)
    elif event.game_type == GameType.billiard:
        user.billiard_points = max(0, user.billiard_points - event.points_reward)

    db.delete(registration)
    db.commit()
