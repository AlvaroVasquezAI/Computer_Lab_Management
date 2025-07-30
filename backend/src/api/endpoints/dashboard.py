from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.crud import crud_data
from src.schemas import dashboard as dashboard_schema
from src.auth.security import get_current_teacher 
from src.models.teacher import Teacher


router = APIRouter()

# Note: We are protecting these endpoints. Only a logged-in user can see the dashboard data.
@router.get("/recent-activities", response_model=List[dashboard_schema.RecentActivity])
def read_recent_activities(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get the most recent activities in the system. Requires authentication.
    """
    activities = crud_data.get_recent_activities(db=db, limit=10)
    return activities

@router.get("/top-subjects", response_model=List[dashboard_schema.TopSubject])
def read_top_subjects(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get the subjects with the highest number of uploaded practices. Requires authentication.
    """
    top_subjects = crud_data.get_top_subjects(db=db, limit=5)
    return top_subjects