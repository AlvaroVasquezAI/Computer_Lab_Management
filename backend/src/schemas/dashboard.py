from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class RecentActivity(BaseModel):
    """
    Defines the shape for a single "Recent Activity" item.
    """
    activity_type: str
    item_name: str
    teacher_name: str
    activity_date: datetime

    class Config:
        from_attributes = True

class TopSubject(BaseModel):
    """
    Defines the shape for a single "Top Subject" item.
    """
    subject_name: str
    practice_count: int

    class Config:
        from_attributes = True

class TeacherSummary(BaseModel):
    teacher_name: str
    class Config: from_attributes = True

class RoomSummary(BaseModel):
    room_name: str
    class Config: from_attributes = True

class GroupSummary(BaseModel):
    group_name: str
    class Config: from_attributes = True

class AnnouncementCreate(BaseModel):
    description: str
    room_id: Optional[int] = None
    group_id: Optional[int] = None

class Announcement(BaseModel):
    announcement_id: int
    description: str
    created_at: datetime
    teacher: TeacherSummary
    room: Optional[RoomSummary] = None
    group: Optional[GroupSummary] = None
    teacher_id: int

    class Config:
        from_attributes = True

class PositionStats(BaseModel):
    my_completed_sessions: int
    total_completed_sessions: int
    rank: int
    my_weekly_sessions: int
    total_weekly_sessions: int
    my_monthly_sessions: int
    total_monthly_sessions: int

class TopGroup(BaseModel):
    group_name: str
    completed_sessions: int

    class Config:
        from_attributes = True

class AnnouncementUpdate(BaseModel):
    description: str