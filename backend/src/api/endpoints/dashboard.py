from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.crud import crud_data, crud_dashboard
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
    Get the subjects with the highest number of uploaded practices.
    """
    top_subjects_data = crud_dashboard.get_top_subjects(db=db, limit=3)
    
    return [
        {"subject_name": item.subject_name, "practice_count": item.practice_count}
        for item in top_subjects_data
    ]

@router.get("/activity-log")
def read_activity_log(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return crud_dashboard.get_recent_logs_for_teacher(db, teacher_id=current_teacher.teacher_id)

@router.get("/next-practice")
def read_next_practice(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    next_practice_data = crud_dashboard.get_next_practice_for_teacher(db, teacher_id=current_teacher.teacher_id)

    if not next_practice_data:
        return None

    return {
        "practice_date": next_practice_data.practice_date,
        "start_time": next_practice_data.start_time,
        "title": next_practice_data.title,
        "group_name": next_practice_data.group_name,
        "practice_id": next_practice_data.practice_id
    }

@router.get("/top-groups", response_model=List[dashboard_schema.TopGroup])
def read_top_groups(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    top_groups_data = crud_dashboard.get_top_performing_groups(db, teacher_id=current_teacher.teacher_id)

    return [
        {"group_name": group.group_name, "completed_sessions": group.completed_sessions}
        for group in top_groups_data
    ]

@router.get("/announcements", response_model=List[dashboard_schema.Announcement])
def read_announcements(db: Session = Depends(get_db)):
    return crud_dashboard.get_announcements(db, limit=5)

@router.post("/announcements", response_model=dashboard_schema.Announcement)
def create_announcement_endpoint(
    ad_in: dashboard_schema.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return crud_dashboard.create_announcement(
        db=db, teacher_id=current_teacher.teacher_id,
        description=ad_in.description, room_id=ad_in.room_id, group_id=ad_in.group_id
    )

@router.get("/position-stats", response_model=dashboard_schema.PositionStats)
def read_position_stats(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return crud_dashboard.get_teacher_position_stats(db, teacher_id=current_teacher.teacher_id)