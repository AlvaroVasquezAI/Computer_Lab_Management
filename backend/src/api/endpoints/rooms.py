from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import date

from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.crud import crud_room
from src.schemas import room as room_schema

router = APIRouter()

@router.get("/{room_id}/bookings", response_model=List[room_schema.BookingDetailForRoom])
def get_room_bookings_by_date(
    room_id: int,
    target_date: date = Query(..., description="The date to fetch bookings for, in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all scheduled bookings for a specific room on a given date.
    This provides the data needed for the Lab Status timeline view.
    """
    return crud_room.get_bookings_for_room_on_date(db, room_id=room_id, target_date=target_date)

@router.get("/{room_id}/monthly-availability", response_model=Dict[int, float])
def get_room_monthly_availability(
    room_id: int,
    year: int = Query(..., description="The year to fetch availability for"),
    month: int = Query(..., ge=1, le=12, description="The month to fetch availability for (1-12)"),
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get the number of busy 30-minute slots for each day of a given month.
    The response is a dictionary where keys are the day of the month.
    """
    return crud_room.get_monthly_availability_for_room(
        db, room_id=room_id, year=year, month=month
    )