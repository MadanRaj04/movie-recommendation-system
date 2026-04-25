from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    overview = Column(String)
    genres = Column(String)
    rating = Column(Float)
    popularity = Column(Float)