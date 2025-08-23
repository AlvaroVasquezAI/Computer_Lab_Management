from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.crud import crud_activity
from src.schemas import activity as activity_schema

router = APIRouter()

@router.get("/calendar", response_model=List[activity_schema.CalendarDay])
def get_teacher_calendar_activities(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
    year: int = Query(..., description="The year to fetch activities for"),
    month: int = Query(..., ge=1, le=12, description="The month to fetch activities for (1-12)")
):
    """
    Get all scheduled activities (bookings) for the logged-in teacher for a specific month.
    """
    return crud_activity.get_monthly_bookings_for_teacher(
        db, teacher_id=current_teacher.teacher_id, year=year, month=month
    )