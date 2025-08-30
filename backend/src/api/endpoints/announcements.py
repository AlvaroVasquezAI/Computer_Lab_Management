from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.crud import crud_announcement
from src.schemas import dashboard as dashboard_schema

router = APIRouter()

@router.get("/", response_model=List[dashboard_schema.Announcement])
def read_all_announcements(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
    time_filter: str = Query("all", enum=["all", "month", "day"]),
    teacher_id: Optional[int] = Query(None)
):
    """
    Get all announcements with optional filters.
    """
    return crud_announcement.get_announcements_with_filters(
        db, time_filter=time_filter, teacher_id_filter=teacher_id
    )

@router.put("/{announcement_id}", response_model=dashboard_schema.Announcement)
def update_announcement_endpoint(
    announcement_id: int,
    announcement_in: dashboard_schema.AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    """
    Update an announcement. Must be the owner.
    """
    db_announcement = crud_announcement.get_announcement_by_id(db, announcement_id=announcement_id)
    if not db_announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    
    if db_announcement.teacher_id != current_teacher.teacher_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this announcement")
        
    return crud_announcement.update_announcement(
        db, db_announcement=db_announcement, announcement_in=announcement_in
    )

@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement_endpoint(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    """
    Delete an announcement. Must be the owner.
    """
    db_announcement = crud_announcement.get_announcement_by_id(db, announcement_id=announcement_id)
    if not db_announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    
    if db_announcement.teacher_id != current_teacher.teacher_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this announcement")

    crud_announcement.delete_announcement(db, db_announcement=db_announcement)
    return