from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

user = User(
    id=1,
    email="test@example.com",
    password="test123"
)

db.add(user)
db.commit()
db.close()