from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models.event import Event, GameType
from app.models.user import User
from app.schemas.event import EventCreate, EventRead, RegistrationRead
from app.services.event_service import cancel_registration, count_registrations, create_event, list_events, register_for_event
from app.services.logging_service import log_action

router = APIRouter(prefix="/events", tags=["events"])


def to_event_read(db: Session, event: Event) -> EventRead:
    data = EventRead.model_validate(event)
    data.registered_count = count_registrations(db, event.id)
    return data


@router.get("", response_model=list[EventRead])
def get_events(game_type: GameType | None = Query(default=None), db: Session = Depends(get_db)) -> list[EventRead]:
    return [to_event_read(db, event) for event in list_events(db, game_type)]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def post_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> EventRead:
    event = create_event(db, payload)
    log_action(db, admin.id, "event_created", f"event_id={event.id}")
    return to_event_read(db, event)


@router.post("/{event_id}/register", response_model=RegistrationRead)
def register_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistrationRead:
    registration = register_for_event(db, event_id, current_user)
    log_action(db, current_user.id, "event_registered", f"event_id={event_id}")
    return RegistrationRead(event_id=registration.event_id, user_id=registration.user_id, status="registered")


@router.delete("/{event_id}/register", status_code=status.HTTP_204_NO_CONTENT)
def cancel_event_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    cancel_registration(db, event_id, current_user)
    log_action(db, current_user.id, "event_registration_cancelled", f"event_id={event_id}")
