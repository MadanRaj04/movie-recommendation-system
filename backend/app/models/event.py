from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    movie_id = Column(Integer, ForeignKey("movies.id"))
    event_type = Column(String)
    timestamp = Column(String)