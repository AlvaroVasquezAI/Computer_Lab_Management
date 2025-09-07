from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func 
from src.models import booking, practice, teacher, subject, group, room
from datetime import date

def get_completed_practices_query(db: Session):
    """
    Creates the base SQLAlchemy query to fetch all completed practice sessions.
    A session is considered completed if its combined date and end_time is in the past.
    This query is timezone-aware, making it more accurate.
    """
    aware_end_timestamp = func.timezone('America/Mexico_City', booking.Booking.practice_date + booking.Booking.end_time)
    
    return (
        db.query(
            booking.Booking.practice_date,
            booking.Booking.start_time,
            booking.Booking.end_time,
            practice.Practice.practice_id,
            practice.Practice.title.label("practice_name"),
            practice.Practice.file_url,
            teacher.Teacher.teacher_id,
            teacher.Teacher.teacher_name,
            subject.Subject.subject_id,
            subject.Subject.subject_name,
            group.Group.group_id,
            group.Group.group_name,
            room.Room.room_id,
            room.Room.room_name
        )
        .join(practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id)
        .join(teacher.Teacher, practice.Practice.teacher_id == teacher.Teacher.teacher_id)
        .join(subject.Subject, practice.Practice.subject_id == subject.Subject.subject_id)
        .join(group.Group, booking.Booking.group_id == group.Group.group_id)
        .join(room.Room, booking.Booking.room_id == room.Room.room_id)
        .filter(aware_end_timestamp < func.now()) 
        .order_by(booking.Booking.practice_date.desc())
    )

def by_teacher(db: Session, teacher_id: int):
    query = get_completed_practices_query(db)
    return query.filter(teacher.Teacher.teacher_id == teacher_id).all()

def by_room(db: Session, room_id: int):
    query = get_completed_practices_query(db)
    return query.filter(room.Room.room_id == room_id).all()

def by_subject(db: Session, subject_id: int):
    query = get_completed_practices_query(db)
    return query.filter(subject.Subject.subject_id == subject_id).all()

def by_group(db: Session, group_id: int):
    query = get_completed_practices_query(db)
    return query.filter(group.Group.group_id == group_id).all()

def all_completed(db: Session):
    """
    Fetches all completed practice sessions without any specific filter.
    """
    return get_completed_practices_query(db).all()