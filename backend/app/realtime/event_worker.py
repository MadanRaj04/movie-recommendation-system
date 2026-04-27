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


# How much each interaction type contributes to the user vector.
EVENT_WEIGHTS = {
    "click": 0.2,
    "play":  0.5,
    "watch": 1.0,
}


def update_user_profile(db: Session, user_id: int, movie_text: str, weight: float):
    movie_emb = np.array(get_embedding(movie_text), dtype=np.float32)

    # Normalize the incoming movie embedding to unit vector
    movie_norm = np.linalg.norm(movie_emb)
    if movie_norm > 0:
        movie_emb = movie_emb / movie_norm

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    if profile:
        user_vec = np.frombuffer(profile.embedding, dtype=np.float32).copy()
        # Weighted accumulation: add the event's contribution to the running sum.
        # This is equivalent to computing a weighted centroid in embedding space.
        # Multiple horror movie events all push in the same direction, reinforcing it.
        # The subsequent normalization keeps it as a unit vector for FAISS.
        user_vec = user_vec + weight * movie_emb
    else:
        user_vec = weight * movie_emb

    # Always L2-normalize so FAISS IndexFlatIP == cosine similarity
    vec_norm = np.linalg.norm(user_vec)
    if vec_norm > 0:
        user_vec = user_vec / vec_norm

    db.merge(UserProfile(
        user_id=user_id,
        embedding=user_vec.astype(np.float32).tobytes()
    ))
    db.commit()


def worker():
    print("Worker started...")
    db = SessionLocal()

    while True:
        event = get_event()

        user_id    = event["user_id"]
        movie_id   = event["movie_id"]
        event_type = event["event_type"]

        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            print(f"movie_id={movie_id} not in DB — skipping")
            continue

        text   = f"{movie.title} {movie.overview} {movie.genres}"
        weight = EVENT_WEIGHTS.get(event_type, 0.1)

        update_user_profile(db, user_id, text, weight)
        print(f"User {user_id} ← {event_type} '{movie.title}' (w={weight})")


if __name__ == "__main__":
    worker()
