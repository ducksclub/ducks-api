from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.schemas.content import FAQItem, FeedbackCreate, FeedbackRead, RuleItem
from app.services.content_service import create_feedback, list_faq, list_feedback, list_rules
from app.services.logging_service import log_action

router = APIRouter(tags=["content"])


@router.get("/rules", response_model=list[RuleItem])
def get_rules() -> list[RuleItem]:
    return list_rules()


@router.get("/faq", response_model=list[FAQItem])
def get_faq() -> list[FAQItem]:
    return list_faq()


@router.post("/feedback", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
def post_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)) -> FeedbackRead:
    feedback = create_feedback(db, payload)
    log_action(db, None, "feedback_created", f"feedback_id={feedback.id}")
    return feedback


@router.post("/feedback/me", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
def post_authorized_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FeedbackRead:
    feedback = create_feedback(db, payload, current_user)
    log_action(db, current_user.id, "feedback_created", f"feedback_id={feedback.id}")
    return feedback


@router.get("/feedback", response_model=list[FeedbackRead])
def get_feedback_items(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[FeedbackRead]:
    return list_feedback(db)
