from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.recommendation_service import get_recommendations

router = APIRouter()


@router.get("/{user_id}")
def recommend(user_id: int, db: Session = Depends(get_db)):
    movies = get_recommendations(db, user_id)

    return [
        {
            "id": m.id,
            "title": m.title,
            "genres": m.genres,
            "rating": m.rating
        }
        for m in movies
    ]