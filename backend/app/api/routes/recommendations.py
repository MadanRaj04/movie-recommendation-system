from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.recommendation_service import get_recommendations, get_user_history
from app.llm.recommendation_agent import generate_explanation
router = APIRouter()

@router.get("/{user_id}")
def recommend(user_id: int, db: Session = Depends(get_db)):
    movies = get_recommendations(db, user_id)
    history = get_user_history(db, user_id)

    movie_titles = [m.title for m in movies]

    #explanation = generate_explanation(history, movie_titles)

    return {
        "recommendations": [
            {
                "id": m.id,
                "title": m.title,
                "genres": m.genres
            }
            for m in movies
        ],
        #"explanation": explanation
    }