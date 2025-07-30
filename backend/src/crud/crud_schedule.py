from sqlalchemy.orm import Session
from src.models.schedule import Schedule
from typing import List

def get_schedules_for_group_on_day(db: Session, group_id: int, day_of_week: int) -> List[Schedule]:
    """
    Fetches all existing schedule entries for a specific group on a specific day.
    """
    return db.query(Schedule).filter(
        Schedule.group_id == group_id,
        Schedule.day_of_week == day_of_week
    ).all()