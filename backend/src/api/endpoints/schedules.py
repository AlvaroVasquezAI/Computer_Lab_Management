from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import schedule as schedule_model, group as group_model, subject as subject_model
from typing import Optional

router = APIRouter()

@router.get("/availability")
def get_schedule_availability(
    db: Session = Depends(get_db),
    group_name: str = Query(..., min_length=1),
    teacher_id_to_exclude: Optional[int] = Query(None)
):
    """
    Fetches all busy time slots for a given group.
    In edit mode (when teacher_id_to_exclude is provided), it fetches only
    the schedules for the group that do NOT belong to the teacher being edited.
    The teacher's own schedule conflicts are handled by the frontend's state.
    """

    group_busy_slots = {}
    db_group = db.query(group_model.Group).filter(group_model.Group.group_name == group_name).first()
    
    if db_group:
        query = db.query(
            schedule_model.Schedule, 
            subject_model.Subject.subject_name
        ).join(
            subject_model.Subject, schedule_model.Schedule.subject_id == subject_model.Subject.subject_id
        ).filter(schedule_model.Schedule.group_id == db_group.group_id)
        
        if teacher_id_to_exclude:
            query = query.filter(schedule_model.Schedule.teacher_id != teacher_id_to_exclude)
            
        group_schedules = query.all()
        
        for sch, subject_name in group_schedules:
            if sch.day_of_week not in group_busy_slots:
                group_busy_slots[sch.day_of_week] = []
            group_busy_slots[sch.day_of_week].append({
                "start_time": sch.start_time.strftime('%H:%M:%S'),
                "end_time": sch.end_time.strftime('%H:%M:%S'),
                "schedule_type": sch.schedule_type.value,
                "subject_name": subject_name
            })

    teacher_busy_slots = {}

    return {
        "group_busy_slots": group_busy_slots,
        "teacher_busy_slots": teacher_busy_slots,
    }