from sqlalchemy.orm import Session

from app.models.action_log import ActionLog


def log_action(db: Session, user_id: int | None, action: str, details: str = "") -> None:
    db.add(ActionLog(user_id=user_id, action=action, details=details[:500]))
    db.commit()
