import faiss
import numpy as np
import requests
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.user_profile import UserProfile
from app.models.event import Event


# ── FAISS index ──────────────────────────────────────────────────────────────
index    = faiss.read_index("vector_db/faiss_index/movies.index")
movie_ids = np.load("vector_db/faiss_index/movie_ids.npy")

# ── Ollama ───────────────────────────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "nomic-embed-text"


def get_embedding(text):
    response = requests.post(
        OLLAMA_URL,
        json={"model": MODEL_NAME, "prompt": text}
    )
    return response.json()["embedding"]


def get_user_vector(db: Session, user_id: int):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile is None:
        return None
    return np.frombuffer(profile.embedding, dtype=np.float32).copy()


def get_default_recommendations(db: Session, limit: int = 10):
    return db.query(Movie).order_by(Movie.popularity.desc()).limit(limit).all()


def get_watched_movie_ids(db: Session, user_id: int):
    """
    Only exclude movies the user has *played or watched* — not mere clicks.
    This way clicking many movies in the genre rows won't collapse the rec pool.
    """
    events = (
        db.query(Event.movie_id)
        .filter(
            Event.user_id == user_id,
            Event.event_type.in_(["play", "watch"])
        )
        .distinct()
        .all()
    )
    return set(e[0] for e in events)


def get_recommendations(db: Session, user_id: int, top_k: int = 150):
    user_vector = get_user_vector(db, user_id)

    # ── Cold start ────────────────────────────────────────────────────────────
    if user_vector is None:
        return get_default_recommendations(db)

    # Normalize before FAISS search (IndexFlatIP == cosine sim for unit vecs)
    user_vector = user_vector.astype("float32").reshape(1, -1)
    faiss.normalize_L2(user_vector)

    # Search larger candidate pool so filtering doesn't empty the list
    scores, indices = index.search(user_vector, top_k)

    watched_ids = get_watched_movie_ids(db, user_id)

    recommended_ids = []
    for idx in indices[0]:
        if idx < 0:          # FAISS pads with -1 when index is smaller than top_k
            continue
        movie_id = int(movie_ids[idx])
        if movie_id not in watched_ids:
            recommended_ids.append(movie_id)
        if len(recommended_ids) >= 10:
            break

    # ── Fallback: if too many watched, relax the filter ───────────────────────
    if len(recommended_ids) < 5:
        # Re-scan with no watch filter — just give top results
        recommended_ids = []
        for idx in indices[0]:
            if idx < 0:
                continue
            recommended_ids.append(int(movie_ids[idx]))
            if len(recommended_ids) >= 10:
                break

    if not recommended_ids:
        return get_default_recommendations(db)

    movies = db.query(Movie).filter(Movie.id.in_(recommended_ids)).all()

    # Preserve FAISS ranking order
    order_map = {mid: pos for pos, mid in enumerate(recommended_ids)}
    movies.sort(key=lambda m: order_map.get(m.id, 999))

    return movies


def get_user_history(db: Session, user_id: int, limit: int = 5):
    events = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .order_by(Event.id.desc())
        .limit(limit)
        .all()
    )
    ids    = [e.movie_id for e in events]
    movies = db.query(Movie).filter(Movie.id.in_(ids)).all()
    return [m.title for m in movies]


def get_recently_watched(db: Session, user_id: int, limit: int = 5):
    events = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .order_by(Event.id.desc())
        .limit(limit)
        .all()
    )
    return [e.movie_id for e in events]
