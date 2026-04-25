import faiss
import numpy as np
import requests
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.user_profile import UserProfile
from app.models.event import Event


def get_watched_movie_ids(db, user_id):
    events = db.query(Event.movie_id).filter(Event.user_id == user_id).all()
    return set([e[0] for e in events])




# Load FAISS
index = faiss.read_index("vector_db/faiss_index/movies.index")
movie_ids = np.load("vector_db/faiss_index/movie_ids.npy")

# Ollama config
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

    return np.frombuffer(profile.embedding, dtype=np.float32)

def get_default_recommendations(db: Session, limit=10):
    movies = db.query(Movie).order_by(Movie.popularity.desc()).limit(limit).all()
    return movies

def get_recommendations(db: Session, user_id: int, top_k=20):
    user_vector = get_user_vector(db, user_id)

    # Cold start
    if user_vector is None:
        return get_default_recommendations(db)

    user_vector = np.array([user_vector]).astype("float32")
    faiss.normalize_L2(user_vector)

    scores, indices = index.search(user_vector, top_k)

    watched_ids = get_watched_movie_ids(db, user_id)

    recent_ids = get_recently_watched(db, user_id)

    boost_set = set(recent_ids)

    recommended_ids = []


    for i in indices[0]:
        movie_id = int(movie_ids[i])

        if movie_id in watched_ids:
            continue

        # Boost recent-style movies
        if movie_id in boost_set:
            recommended_ids.insert(0, movie_id)
        else:
            recommended_ids.append(movie_id)

        if len(recommended_ids) >= 10:
            break

    movies = db.query(Movie).filter(Movie.id.in_(recommended_ids)).all()

    return movies


def get_user_history(db, user_id, limit=5):
    from app.models.event import Event
    from app.models.movie import Movie

    events = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .order_by(Event.id.desc())
        .limit(limit)
        .all()
    )

    movie_ids = [e.movie_id for e in events]

    movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()

    return [m.title for m in movies]

def get_recently_watched(db, user_id, limit=5):
    events = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .order_by(Event.id.desc())
        .limit(limit)
        .all()
    )

    return [e.movie_id for e in events]