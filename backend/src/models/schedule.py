from sqlalchemy import Column, Integer, Time, ForeignKey, Enum
from sqlalchemy.orm import relationship
from src.database import Base
import enum

class ScheduleType(str, enum.Enum):
    CLASS = "CLASS"
    PRACTICE = "PRACTICE"


class Schedule(Base):
    __tablename__ = "schedules"
    schedule_id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"))
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))
    group_id = Column(Integer, ForeignKey("groups.group_id"))
    day_of_week = Column(Integer, nullable=False) 
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    schedule_type = Column(Enum(ScheduleType), nullable=False, default=ScheduleType.CLASS, server_default=ScheduleType.CLASS.value)

    # Relationships
    teacher = relationship("Teacher", back_populates="schedules")
    subject = relationship("Subject", back_populates="schedules")
    group = relationship("Group", back_populates="schedules")