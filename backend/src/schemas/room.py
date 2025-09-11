from pydantic import BaseModel
from datetime import time
from typing import Optional

class Room(BaseModel):
    room_id: int
    room_name: str
    capacity: Optional[int] = None
    class Config:
        from_attributes = True

class BookingTeacher(BaseModel):
    teacher_name: str

class BookingSubject(BaseModel):
    subject_name: str
    class Config:
        from_attributes = True
        
class BookingPractice(BaseModel):
    title: str
    teacher: BookingTeacher
    subject: BookingSubject 

class BookingGroup(BaseModel):
    group_name: str
    class Config:
        from_attributes = True

class BookingDetailForRoom(BaseModel):
    start_time: time
    end_time: time
    practice: BookingPractice 
    group: BookingGroup

    class Config:
        from_attributes = True