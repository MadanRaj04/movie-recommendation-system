import json
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.core.database import SessionLocal
from app.models.movie import Movie

DATA_PATH = "data/raw/movies_clean.jsonl"


def load_movies():
    db: Session = SessionLocal()

    batch = []
    count = 0

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)

            movie_data = {
                "id": data.get("tmdb_id"),
                "title": data.get("title"),
                "overview": data.get("overview"),
                "genres": ", ".join(data.get("genres", [])),
                "rating": data.get("rating", 0.0),
                "popularity": data.get("popularity", 0.0),
            }

            batch.append(movie_data)
            count += 1

            if len(batch) >= 500:
                insert_batch(db, batch)
                print(f"Inserted {count} movies...")
                batch = []

        if batch:
            insert_batch(db, batch)

    print(f"✅ Total processed: {count}")
    db.close()


def insert_batch(db, batch):
    stmt = insert(Movie).values(batch)

    stmt = stmt.on_conflict_do_nothing(index_elements=["id"])

    db.execute(stmt)
    db.commit()


if __name__ == "__main__":
    load_movies()