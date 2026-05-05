from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserRead
from app.services.logging_service import log_action
from app.services.user_service import authenticate_user, build_token_for_user, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    user = create_user(db, payload)
    log_action(db, user.id, "user_registered", "User created account")
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, payload.email, payload.password)
    log_action(db, user.id, "user_logged_in", "User requested JWT token")
    return Token(access_token=build_token_for_user(user))


@router.get("/me", response_model=UserRead)
def get_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


# Alias for Telegram and simple clients that expect /register at API root.
root_router = APIRouter(tags=["auth"])


@root_router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_root(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    user = create_user(db, payload)
    log_action(db, user.id, "user_registered", "User created account via /register")
    return user
