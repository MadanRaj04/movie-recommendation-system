from pydantic import BaseModel

class EventCreate(BaseModel):
    user_id: int
    movie_id: int
    event_type: str  # click, play, watch