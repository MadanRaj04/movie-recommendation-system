from sqlalchemy.orm import Session
from app.models.event import Event
from datetime import datetime


def store_event(db: Session, event_data):
    event = Event(
        user_id=event_data.user_id,
        movie_id=event_data.movie_id,
        event_type=event_data.event_type,
        timestamp=str(datetime.utcnow())
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event