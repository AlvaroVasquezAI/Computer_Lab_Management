from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from src.database import Base
import enum

class LogType(str, enum.Enum):
    CREATED = "CREATED"
    EDITED = "EDITED"
    DELETED = "DELETED"

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"), nullable=False)
    activity_type = Column(Enum(LogType), nullable=False)
    practice_title = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())