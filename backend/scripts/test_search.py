import faiss
import numpy as np
import requests

# Ollama config
OLLAMA_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "nomic-embed-text"

# Load FAISS index
index = faiss.read_index("vector_db/faiss_index/movies.index")
movie_ids = np.load("vector_db/faiss_index/movie_ids.npy")


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
        print(f"Error: {e}")
        return None


def search(query, top_k=5):
    query_vec = get_embedding(query)

    if query_vec is None:
        return []

    query_vec = np.array([query_vec]).astype("float32")

    # Normalize for cosine similarity
    faiss.normalize_L2(query_vec)

    scores, indices = index.search(query_vec, top_k)

    results = []
    for idx in indices[0]:
        results.append(int(movie_ids[idx]))

    return results


if __name__ == "__main__":
    print(search("space adventure sci-fi"))