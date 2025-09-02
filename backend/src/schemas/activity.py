from pydantic import BaseModel
from typing import List
from datetime import date, time

class ActivityBooking(BaseModel):
    practice_title: str
    group_name: str
    room_name: str
    subject_name: str
    practice_date: date
    start_time: time
    end_time: time

    class Config:
        from_attributes = True

class CalendarDay(BaseModel):
    date: date
    bookings: List[ActivityBooking]