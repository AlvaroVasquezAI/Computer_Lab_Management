from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base

class Announcement(Base):
    __tablename__ = "announcements"
    announcement_id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"))
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=True)
    group_id = Column(Integer, ForeignKey("groups.group_id"), nullable=True)
    
    teacher = relationship("Teacher")
    room = relationship("Room")
    group = relationship("Group")