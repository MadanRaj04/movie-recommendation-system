from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def track_event():
    return {"status": "event received"}