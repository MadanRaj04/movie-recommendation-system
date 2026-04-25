from fastapi import FastAPI
from app.api.routes import movies, recommendations, events, auth
from app.core.database import Base, engine
from app.models import user, movie, event, user_profile

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Movie Recommendation System")

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(movies.router, prefix="/movies", tags=["Movies"])
app.include_router(recommendations.router, prefix="/recommend", tags=["Recommendations"])
app.include_router(events.router, prefix="/events", tags=["Events"])


@app.get("/")
def root():
    return {"message": "API is running 🚀"}