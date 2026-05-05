from app.database.session import Base, engine

# Import models so SQLAlchemy sees every table before create_all().
from app.models import action_log, event, feedback, registration, user  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
