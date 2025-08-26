from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models import practice, teacher, subject, room

def get_recent_activities(db: Session, limit: int = 10):
    """
    Retrieves the most recent activities (currently just practice uploads).
    """
    recent_practices = (
        db.query(
            practice.Practice.title,
            teacher.Teacher.teacher_name,
            practice.Practice.created_at
        )
        .join(teacher.Teacher, practice.Practice.teacher_id == teacher.Teacher.teacher_id)
        .order_by(practice.Practice.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for p_title, t_name, p_date in recent_practices:
        activities.append({
            "activity_type": "Practice Uploaded",
            "item_name": p_title,
            "teacher_name": t_name,
            "activity_date": p_date,
        })
    return activities

def get_rooms(db: Session):
    return db.query(room.Room).order_by(room.Room.room_name).all()