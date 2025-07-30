from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base

class Subject(Base):
    __tablename__ = "subjects"
    subject_id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String, nullable=False, unique=True)
    
    # Relationships
    schedules = relationship("Schedule", back_populates="subject")
    practices = relationship("Practice", back_populates="subject")