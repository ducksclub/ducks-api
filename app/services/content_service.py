from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.content import FAQItem, FeedbackCreate, RuleItem

RULES = [
    RuleItem(title="Регистрация", text="Участник записывается на мероприятие заранее через сайт или Telegram-бота."),
    RuleItem(title="Пунктуальность", text="Приходите за 10 минут до старта, чтобы организаторы успели подтвердить участие."),
    RuleItem(title="Fair play", text="Уважайте соперников, ведущих и правила конкретной игры."),
    RuleItem(title="Рейтинг", text="Очки начисляются за участие и могут корректироваться администрацией клуба."),
]

FAQ = [
    FAQItem(question="Как записаться?", answer="Создайте аккаунт, откройте мероприятие и нажмите запись."),
    FAQItem(question="Можно ли отменить запись?", answer="Да, отмена доступна в профиле или через endpoint отмены записи."),
    FAQItem(question="Какие игры есть?", answer="Покер, дартс и бильярд. Список можно фильтровать по типу игры."),
]


def list_rules() -> list[RuleItem]:
    return RULES


def list_faq() -> list[FAQItem]:
    return FAQ


def create_feedback(db: Session, payload: FeedbackCreate, user: User | None = None) -> Feedback:
    feedback = Feedback(user_id=user.id if user else None, **payload.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def list_feedback(db: Session) -> list[Feedback]:
    return list(db.query(Feedback).order_by(Feedback.created_at.desc()).all())


def get_feedback(db: Session, feedback_id: int) -> Feedback:
    feedback = db.get(Feedback, feedback_id)
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return feedback
