from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base

class Group(Base):
    __tablename__ = "groups"
    group_id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String, nullable=False, unique=True)
    
    # Relationships
    schedules = relationship("Schedule", back_populates="group")
    bookings = relationship("Booking", back_populates="group")