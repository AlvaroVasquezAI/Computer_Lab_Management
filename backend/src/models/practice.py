from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base

class Practice(Base):
    __tablename__ = "practices"
    practice_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"))
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))

    # Relationships
    teacher = relationship("Teacher", back_populates="practices")
    subject = relationship("Subject", back_populates="practices")
    bookings = relationship("Booking", back_populates="practice")