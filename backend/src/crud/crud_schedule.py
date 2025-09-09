from sqlalchemy.orm import Session
from src.models.schedule import Schedule, ScheduleType
from typing import List
from datetime import time

def get_schedules_for_group_on_day(db: Session, group_id: int, day_of_week: int) -> List[Schedule]:
    """
    Fetches all existing schedule entries for a specific group on a specific day.
    """
    return db.query(Schedule).filter(
        Schedule.group_id == group_id,
        Schedule.day_of_week == day_of_week
    ).all()

def count_conflicting_practices(db: Session, day_of_week: int, start_time: time, end_time: time) -> int:
    """
    Counts how many "PRACTICE" sessions are already scheduled in the database
    that conflict with the given time slot on a specific day of the week.
    """
    return db.query(Schedule).filter(
        Schedule.day_of_week == day_of_week,
        Schedule.start_time < end_time,
        Schedule.end_time > start_time,
        Schedule.schedule_type == ScheduleType.PRACTICE
    ).count()