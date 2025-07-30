from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models import practice, teacher, subject

def get_recent_activities(db: Session, limit: int = 5):
    """
    Retrieves the most recent activities (currently just practice uploads).
    """
    # This query joins the Practice table with the Teacher table
    # to fetch the practice title, teacher's name, and creation date.
    # It orders by the date in descending order to get the newest ones first.
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

    # We format the raw database results into a list of dictionaries
    # that matches the structure of our Pydantic schema.
    activities = []
    for p_title, t_name, p_date in recent_practices:
        activities.append({
            "activity_type": "Practice Uploaded",
            "item_name": p_title,
            "teacher_name": t_name,
            "activity_date": p_date,
        })
    return activities

def get_top_subjects(db: Session, limit: int = 5):
    """
    Retrieves the subjects with the most associated practices.
    """
    # This query joins the Practice table with the Subject table.
    # It groups the results by the subject's name,
    # counts the number of practices in each group,
    # and orders the groups by that count in descending order.
    top_subjects_query = (
        db.query(
            subject.Subject.subject_name,
            func.count(practice.Practice.practice_id).label("practice_count"),
        )
        .join(subject.Subject, practice.Practice.subject_id == subject.Subject.subject_id)
        .group_by(subject.Subject.subject_name)
        .order_by(func.count(practice.Practice.practice_id).desc())
        .limit(limit)
        .all()
    )
    return top_subjects_query