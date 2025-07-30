from pydantic import BaseModel, EmailStr
from typing import Optional

# Shared properties
class TeacherBase(BaseModel):
    teacher_name: str
    email: EmailStr

# Properties to receive via API on creation
class TeacherCreate(TeacherBase):
    password: str

# Properties to return to client
class Teacher(TeacherBase):
    teacher_id: int

    class Config:
        from_attributes = True