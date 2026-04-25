from sqlalchemy import Column, Integer, LargeBinary
from app.core.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(Integer, primary_key=True, index=True)
    embedding = Column(LargeBinary)  # store vector