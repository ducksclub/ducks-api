from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.event import GameType
from app.schemas.rating import RatingItem
from app.services.rating_service import get_rating

router = APIRouter(prefix="/rating", tags=["rating"])


@router.get("", response_model=list[RatingItem])
def overall_rating(limit: int = Query(default=50, ge=1, le=100), db: Session = Depends(get_db)) -> list[RatingItem]:
    return get_rating(db, None, limit)


@router.get("/poker", response_model=list[RatingItem])
def poker_rating(limit: int = Query(default=50, ge=1, le=100), db: Session = Depends(get_db)) -> list[RatingItem]:
    return get_rating(db, GameType.poker, limit)


@router.get("/darts", response_model=list[RatingItem])
def darts_rating(limit: int = Query(default=50, ge=1, le=100), db: Session = Depends(get_db)) -> list[RatingItem]:
    return get_rating(db, GameType.darts, limit)


@router.get("/billiard", response_model=list[RatingItem])
def billiard_rating(limit: int = Query(default=50, ge=1, le=100), db: Session = Depends(get_db)) -> list[RatingItem]:
    return get_rating(db, GameType.billiard, limit)
