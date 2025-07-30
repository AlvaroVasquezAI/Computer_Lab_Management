from sqlalchemy import Column, Integer, Time, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Schedule(Base):
    __tablename__ = "schedules"
    schedule_id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"))
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))
    group_id = Column(Integer, ForeignKey("groups.group_id"))
    day_of_week = Column(Integer, nullable=False) 
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Relationships
    teacher = relationship("Teacher", back_populates="schedules")
    subject = relationship("Subject", back_populates="schedules")
    group = relationship("Group", back_populates="schedules")