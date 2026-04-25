from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.event_schema import EventCreate
from app.services.event_service import store_event
from app.realtime.redis_client import send_event_to_queue

router = APIRouter()


@router.post("/")
def track_event(event: EventCreate, db: Session = Depends(get_db)):
    store_event(db, event)

    # Send to queue for real-time processing
    send_event_to_queue(event.dict())

    return {"status": "event received"}