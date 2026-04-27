import numpy as np
import faiss
import requests
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.movie import Movie

# Ollama config
OLLAMA_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "nomic-embed-text"

OUTPUT_INDEX = "vector_db/faiss_index/movies.index"
OUTPUT_IDS = "vector_db/faiss_index/movie_ids.npy"


def get_embedding(text):
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": text
            }
        )
        response.raise_for_status()
        return response.json()["embedding"]

    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None


def build_embeddings():
    db: Session = SessionLocal()

    movies = db.query(Movie).all()

    embeddings = []
    ids = []

    print("Generating embeddings (Ollama)...")

    for i, movie in enumerate(movies):
        text = f"{movie.title} {movie.overview} {movie.genres}"

        emb = get_embedding(text)

        if emb is None:
            continue

        embeddings.append(emb)
        ids.append(movie.id)

        if i % 100 == 0:
            print(f"Processed {i} movies...")

    embeddings = np.array(embeddings).astype("float32")

    # Normalize for cosine similarity
    faiss.normalize_L2(embeddings)

    dim = embeddings.shape[1]

    # Create FAISS index
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Save index
    faiss.write_index(index, OUTPUT_INDEX)
    np.save(OUTPUT_IDS, np.array(ids))

    print("Embeddings + FAISS index saved")

    db.close()


if __name__ == "__main__":
    build_embeddings()