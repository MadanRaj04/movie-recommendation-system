import faiss
import numpy as np
import requests
from collections import Counter
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.user_profile import UserProfile
from app.models.event import Event

# FAISS index
index     = faiss.read_index("vector_db/faiss_index/movies.index")
movie_ids = np.load("vector_db/faiss_index/movie_ids.npy")

# Ollama
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


def get_user_genre_affinity(db: Session, user_id: int) -> Counter:
    """
    Build a genre preference Counter from the user's play/watch events.
    Weights: watch > play > click
    """
    weights = {"watch": 3, "play": 2, "click": 1}
    events = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .all()
    )
    genre_counter: Counter = Counter()
    movie_ids_seen = {e.movie_id for e in events}
    movies = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(movie_ids_seen)).all()}

    for ev in events:
        movie = movies.get(ev.movie_id)
        if not movie or not movie.genres:
            continue
        w = weights.get(ev.event_type, 1)
        for genre in movie.genres.split(","):
            genre_counter[genre.strip()] += w

    return genre_counter


def get_played_or_watched_ids(db: Session, user_id: int) -> set:
    """
    Only exclude movies the user has actively played or fully watched
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
    return {e[0] for e in events}


def genre_overlap_score(movie_genres: str, affinity: Counter) -> float:
    """
    Returns a [0, 1] score: fraction of this movie's genres that appear
    in the user's top-3 preferred genres (by watch/play weight).
    """
    if not movie_genres or not affinity:
        return 0.0
    top_genres = {g for g, _ in affinity.most_common(3)}
    movie_genre_list = [g.strip() for g in movie_genres.split(",")]
    if not movie_genre_list:
        return 0.0
    overlap = sum(1 for g in movie_genre_list if g in top_genres)
    return overlap / len(movie_genre_list)


def get_recommendations(db: Session, user_id: int, top_k: int = 200):
    user_vector = get_user_vector(db, user_id)

    # Cold start
    if user_vector is None:
        return get_default_recommendations(db)

    # Normalize before search (IndexFlatIP == cosine sim only for unit vectors)
    user_vector = user_vector.astype("float32").reshape(1, -1)
    faiss.normalize_L2(user_vector)

    # Pull a large candidate pool
    scores, indices = index.search(user_vector, top_k)

    watched_ids  = get_played_or_watched_ids(db, user_id)
    affinity     = get_user_genre_affinity(db, user_id)
    total_weight = sum(affinity.values()) or 1

    # Score every candidate
    # combined = 0.7 × cosine_similarity + 0.3 × genre_affinity_overlap
    # Genre signal corrects cases where FAISS finds semantically nearby movies
    # that don't match the user's actual watched genre pattern.
    candidates = []
    for rank, idx in enumerate(indices[0]):
        if idx < 0:
            continue
        faiss_score  = float(scores[0][rank])          # cosine similarity [-1, 1]
        mid          = int(movie_ids[idx])
        candidates.append((mid, faiss_score))

    # Fetch all candidate movies in one query
    cand_ids  = [mid for mid, _ in candidates]
    movie_map = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(cand_ids)).all()}

    scored = []
    for mid, faiss_score in candidates:
        movie = movie_map.get(mid)
        if not movie:
            continue
        genre_score  = genre_overlap_score(movie.genres, affinity)
        combined     = 0.70 * faiss_score + 0.30 * genre_score
        scored.append((mid, combined, mid in watched_ids))

    # Sort by combined score descending
    scored.sort(key=lambda x: -x[1])

    # First pass: filter out watched movies
    filtered = [mid for mid, _, watched in scored if not watched][:10]

    # Fallback: if pool is too small, ignore watch filter
    if len(filtered) < 5:
        filtered = [mid for mid, _, _ in scored][:10]

    if not filtered:
        return get_default_recommendations(db)

    movies = db.query(Movie).filter(Movie.id.in_(filtered)).all()

    # Preserve reranked order
    order_map = {mid: pos for pos, mid in enumerate(filtered)}
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