from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, time

class PracticeStats(BaseModel):
    subject_name: str
    practice_count: int

    class Config:
        from_attributes = True

class ScheduleDetail(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time

    class Config:
        from_attributes = True

class GroupDetail(BaseModel):
    group_name: str
    schedules: List[ScheduleDetail] = []

    class Config:
        from_attributes = True

class SubjectDetail(BaseModel):
    subject_id: int
    subject_name: str
    total_practice_count: int
    groups: List[GroupDetail] = []

    class Config:
        from_attributes = True

class SubjectInGroupDetail(BaseModel):
    subject_name: str
    schedules: List[ScheduleDetail] = []

    class Config:
        from_attributes = True

class GroupDetailWithSubjects(BaseModel):
    group_id: int
    group_name: str
    total_practice_count: int 
    subjects: List[SubjectInGroupDetail] = []

    class Config:
        from_attributes = True

class GroupForSubject(BaseModel):
    group_id: int
    group_name: str
    schedules: List[ScheduleDetail] = [] 

    class Config:
        from_attributes = True

class RoomAvailabilityRequest(BaseModel):
    practice_date: date
    start_time: time
    end_time: time

class AvailableRoom(BaseModel):
    room_id: int
    room_name: str

    class Config:
        from_attributes = True

class PracticeListItem(BaseModel):
    practice_id: int
    title: str
    subject_name: str
    created_at: datetime

    earliest_session_start: Optional[str] = None
    latest_session_end: Optional[str] = None

    class Config:
        from_attributes = True

class BookingDetail(BaseModel):
    group_name: str
    room_name: str
    room_id: int
    practice_date: date
    start_time: time
    end_time: time

class PracticeDetail(BaseModel):
    practice_id: int
    title: str
    description: str
    subject_name: str
    subject_id: int
    created_at: datetime
    file_url: str
    teacher_id: int
    bookings: List[BookingDetail]

class BookingUpdate(BaseModel):
    group_id: int
    room_id: int
    practice_date: date
    start_time: time
    end_time: time

class PracticeUpdate(BaseModel):
    name: str
    objective: str
    subject_id: int
    bookings: List[BookingUpdate]

class ScheduleEntry(BaseModel):
    start_time: time
    end_time: time
    subject_name: str
    group_name: str
    group_id: int

class WeeklySchedule(BaseModel):
    monday: List[ScheduleEntry]
    tuesday: List[ScheduleEntry]
    wednesday: List[ScheduleEntry]
    thursday: List[ScheduleEntry]
    friday: List[ScheduleEntry]