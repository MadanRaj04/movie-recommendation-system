from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

user = User(
    id=1,
    email="alex@gmail.com",
    password="alex123"
)
user2 = User(
    id=2,
    email="jordan@gmail.com",
    password="jordan123"
)
user3 = User(
    id=3,
    email="sam@gmail.com",
    password="sam123"
)
user4 = User(
    id=4,
    email="morgan@gmail.com",
    password="morgan123"
)



db.add(user)
db.add(user2)
db.add(user3)
db.add(user4)
db.commit()
db.close()