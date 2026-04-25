import numpy as np
import faiss
import requests
from sqlalchemy.orm import Session

from app.models.movie import Movie

# Load FAISS
index = faiss.read_index("vector_db/faiss_index/movies.index")
movie_ids = np.load("vector_db/faiss_index/movie_ids.npy")

OLLAMA_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "nomic-embed-text"


def get_embedding(text):
    response = requests.post(
        OLLAMA_URL,
        json={"model": MODEL_NAME, "prompt": text}
    )
    return response.json()["embedding"]


def search_movies(query, db: Session, top_k=10):
    query_vec = np.array([get_embedding(query)], dtype=np.float32)
    faiss.normalize_L2(query_vec)

    scores, indices = index.search(query_vec, top_k)

    ids = [int(movie_ids[i]) for i in indices[0]]

    movies = db.query(Movie).filter(Movie.id.in_(ids)).all()

    return movies