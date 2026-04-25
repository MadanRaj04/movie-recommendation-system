import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "Movie Recommendation System"
    DATABASE_URL = os.getenv("DATABASE_URL")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

settings = Settings()