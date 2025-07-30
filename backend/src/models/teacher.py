from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from src.database import Base
import enum

class UserRole(str, enum.Enum):
    teacher = "teacher"
    admin = "admin"

class Teacher(Base):
    __tablename__ = "teachers"
    teacher_id = Column(Integer, primary_key=True, index=True)
    teacher_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.teacher)

    # Relationships
    schedules = relationship("Schedule", back_populates="teacher")
    practices = relationship("Practice", back_populates="teacher")