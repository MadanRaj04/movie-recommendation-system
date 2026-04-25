from fastapi import APIRouter

router = APIRouter()

@router.get("/{user_id}")
def get_recommendations(user_id: str):
    return {"user_id": user_id, "recommendations": []}