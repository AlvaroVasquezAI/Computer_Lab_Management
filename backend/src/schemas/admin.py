from pydantic import BaseModel, EmailStr
from typing import List
from src.models.teacher import UserRole
from src.schemas import workspace as workspace_schema, subject as subject_schema, group as group_schema, onboarding as onboarding_schema

class TeacherForAdminList(BaseModel):
    teacher_id: int
    teacher_name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

class AdminTeacherDetail(BaseModel):
    teacher: TeacherForAdminList
    schedule: workspace_schema.WeeklySchedule
    subjects: List[workspace_schema.SubjectDetail]     
    groups: List[workspace_schema.GroupDetailWithSubjects] 
    practices: List[workspace_schema.PracticeListItem]

class RoomCreate(BaseModel):
    room_name: str
    capacity: int

class TeacherUpdateByAdmin(BaseModel):
    teacher_name: str
    email: str 
    role: UserRole
    subjects: List[onboarding_schema.SubjectWithGroups]

class RoomUpdate(BaseModel):
    room_name: str
    capacity: int