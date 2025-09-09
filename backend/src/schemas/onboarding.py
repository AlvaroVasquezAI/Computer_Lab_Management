from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import time
from src.models.schedule import ScheduleType

# A single row in the schedule table
class ScheduleItem(BaseModel):
    day_of_week: int  
    start_time: time
    end_time: time
    schedule_type: Optional[ScheduleType] = ScheduleType.CLASS

# A group, associated with its schedule for a specific subject
class GroupWithSchedule(BaseModel):
    group_name: str
    schedule: List[ScheduleItem]

# A subject, associated with the groups that take it
class SubjectWithGroups(BaseModel):
    subject_id: Optional[int] = None
    subject_name: str
    groups: List[GroupWithSchedule]

# The main payload for the entire onboarding form
class TeacherOnboarding(BaseModel):
    teacher_name: str
    email: EmailStr
    password: str
    subjects: List[SubjectWithGroups]