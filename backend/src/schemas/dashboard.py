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