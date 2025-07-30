from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base

class Room(Base):
    __tablename__ = "rooms"
    room_id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String, nullable=False, unique=True)
    capacity = Column(Integer)
    
    # Relationships
    bookings = relationship("Booking", back_populates="room")