from sqlalchemy import Column, Integer, Date, Time, String, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    booking_id = Column(Integer, primary_key=True, index=True)
    practice_id = Column(Integer, ForeignKey("practices.practice_id"))
    group_id = Column(Integer, ForeignKey("groups.group_id"))
    room_id = Column(Integer, ForeignKey("rooms.room_id"))
    practice_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String, default='Scheduled') # e.g., 'Scheduled', 'Completed', 'Cancelled'
    
    # Relationships
    practice = relationship("Practice", back_populates="bookings")
    group = relationship("Group", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")