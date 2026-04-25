import numpy as np
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user_profile import UserProfile
from app.models.movie import Movie
from app.realtime.redis_client import get_event

import requests

OLLAMA_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "nomic-embed-text"


def get_embedding(text):
    response = requests.post(
        OLLAMA_URL,
        json={"model": MODEL_NAME, "prompt": text}
    )
    return response.json()["embedding"]


def get_weight(event_type):
    return {
        "click": 0.2,
        "play": 0.5,
        "watch": 1.0
    }.get(event_type, 0.1)


def update_user_profile(db: Session, user_id: int, movie_text: str, weight: float):
    embedding = np.array(get_embedding(movie_text), dtype=np.float32)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    if profile:
        user_vec = np.frombuffer(profile.embedding, dtype=np.float32)
        user_vec = user_vec + weight * embedding
    else:
        user_vec = weight * embedding

    profile = UserProfile(
        user_id=user_id,
        embedding=user_vec.astype(np.float32).tobytes()
    )

    db.merge(profile)
    db.commit()


def worker():
    print("🚀 Worker started...")

    db = SessionLocal()

    while True:
        event = get_event()

        user_id = event["user_id"]
        movie_id = event["movie_id"]
        event_type = event["event_type"]

        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            continue

        text = f"{movie.title} {movie.overview} {movie.genres}"

        weight = get_weight(event_type)

        update_user_profile(db, user_id, text, weight)

        print(f"Updated user {user_id} profile")


if __name__ == "__main__":
    worker()