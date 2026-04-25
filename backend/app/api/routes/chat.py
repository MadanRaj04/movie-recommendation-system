from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.chat_service import search_movies
from app.llm.chat_agent import generate_chat_response

router = APIRouter()


class ChatRequest(BaseModel):
    query: str


@router.post("/")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    movies = search_movies(req.query, db)
    response = generate_chat_response(req.query, movies)

    return {
        "response": response,
        "movies": [
            {"id": m.id, "title": m.title, "genres": m.genres}
            for m in movies
        ]
    }