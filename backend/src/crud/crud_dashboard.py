from sqlalchemy.orm import Session
from sqlalchemy import func, TIMESTAMP
from datetime import datetime, timedelta
from src.models import booking, practice, group, subject, activity_log, teacher, announcement, room

APP_TIMEZONE = 'America/Mexico_City'

def create_log_entry(db: Session, teacher_id: int, activity_type: activity_log.LogType, practice_title: str):
    log_entry = activity_log.ActivityLog(teacher_id=teacher_id, activity_type=activity_type, practice_title=practice_title)
    db.add(log_entry)
    db.commit()

def get_recent_logs_for_teacher(db: Session, teacher_id: int, limit: int = 5):
    return db.query(activity_log.ActivityLog).filter(
        activity_log.ActivityLog.teacher_id == teacher_id
    ).order_by(activity_log.ActivityLog.timestamp.desc()).limit(limit).all()

def get_announcements(db: Session, limit: int = 20):
    return db.query(announcement.Announcement).join(
        teacher.Teacher
    ).outerjoin(room.Room).outerjoin(group.Group).order_by(announcement.Announcement.created_at.desc()).limit(limit).all()

def get_top_subjects(db: Session, limit: int = 3):
    """
    Retrieves the subjects with the most associated practices,
    scoped to the current teacher.
    """
    return db.query(
        subject.Subject.subject_name,
        func.count(practice.Practice.practice_id).label("practice_count")
    ).join(
        subject.Subject, practice.Practice.subject_id == subject.Subject.subject_id
    ).group_by(
        subject.Subject.subject_name
    ).order_by(
        func.count(practice.Practice.practice_id).desc()
    ).limit(limit).all()

def create_announcement(db: Session, teacher_id: int, description: str, room_id: int | None, group_id: int | None):
    new_ad = announcement.Announcement(teacher_id=teacher_id, description=description, room_id=room_id, group_id=group_id)
    db.add(new_ad)
    db.commit()
    db.refresh(new_ad)
    return new_ad

def get_next_practice_for_teacher(db: Session, teacher_id: int):
    """
    Finds the very next upcoming practice using a timezone-aware comparison.
    """
    naive_timestamp = booking.Booking.practice_date + booking.Booking.start_time
    aware_timestamp = func.timezone(APP_TIMEZONE, naive_timestamp)
    
    next_booking = db.query(
        booking.Booking.practice_date, booking.Booking.start_time,
        practice.Practice.title, group.Group.group_name, practice.Practice.practice_id
    ).join(
        practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id
    ).join(
        group.Group, booking.Booking.group_id == group.Group.group_id
    ).filter(
        practice.Practice.teacher_id == teacher_id,
        aware_timestamp > func.now() 
    ).order_by(
        booking.Booking.practice_date.asc(),
        booking.Booking.start_time.asc()
    ).first()
    return next_booking

def get_top_performing_groups(db: Session, teacher_id: int, limit: int = 3):
    """
    Finds top groups based on completed sessions using a timezone-aware comparison.
    """
    naive_end_timestamp = booking.Booking.practice_date + booking.Booking.end_time
    aware_end_timestamp = func.timezone(APP_TIMEZONE, naive_end_timestamp)

    return db.query(
        group.Group.group_name,
        func.count(booking.Booking.booking_id).label("completed_sessions")
    ).join(
        practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id
    ).join(
        group.Group, booking.Booking.group_id == group.Group.group_id
    ).filter(
        practice.Practice.teacher_id == teacher_id,
        aware_end_timestamp < func.now()
    ).group_by(group.Group.group_name).order_by(
        func.count(booking.Booking.booking_id).desc()
    ).limit(limit).all()

def get_teacher_position_stats(db: Session, teacher_id: int):
    """
    Calculates teacher rank and stats based on individual completed lab sessions.
    Includes overall, weekly, and monthly totals.
    """
    aware_end_timestamp = func.timezone('America/Mexico_City', booking.Booking.practice_date + booking.Booking.end_time)

    completed_counts_sq = db.query(
        practice.Practice.teacher_id,
        func.count(booking.Booking.booking_id).label("completed_count")
    ).join(practice.Practice).filter(
        aware_end_timestamp < func.now()
    ).group_by(practice.Practice.teacher_id).subquery()
    
    my_stats = db.query(completed_counts_sq).filter(completed_counts_sq.c.teacher_id == teacher_id).first()
    my_completed_sessions = my_stats.completed_count if my_stats else 0
    total_completed_sessions = db.query(func.sum(completed_counts_sq.c.completed_count)).scalar() or 0
    higher_ranked_teachers = db.query(func.count(completed_counts_sq.c.teacher_id)).filter(
        completed_counts_sq.c.completed_count > my_completed_sessions
    ).scalar()
    my_rank = (higher_ranked_teachers or 0) + 1

    now = datetime.utcnow()
    start_of_week = now.date() - timedelta(days=now.weekday())
    start_of_month = now.date().replace(day=1)

    my_weekly_sessions = db.query(func.count(booking.Booking.booking_id)).join(practice.Practice).filter(
        practice.Practice.teacher_id == teacher_id,
        booking.Booking.practice_date >= start_of_week,
        aware_end_timestamp < func.now()
    ).scalar()

    total_weekly_sessions = db.query(func.count(booking.Booking.booking_id)).filter(
        booking.Booking.practice_date >= start_of_week,
        aware_end_timestamp < func.now()
    ).scalar()

    my_monthly_sessions = db.query(func.count(booking.Booking.booking_id)).join(practice.Practice).filter(
        practice.Practice.teacher_id == teacher_id,
        booking.Booking.practice_date >= start_of_month,
        aware_end_timestamp < func.now()
    ).scalar()

    total_monthly_sessions = db.query(func.count(booking.Booking.booking_id)).filter(
        booking.Booking.practice_date >= start_of_month,
        aware_end_timestamp < func.now()
    ).scalar()

    return {
        "my_completed_sessions": my_completed_sessions,
        "total_completed_sessions": total_completed_sessions,
        "rank": my_rank,
        "my_weekly_sessions": my_weekly_sessions,
        "total_weekly_sessions": total_weekly_sessions,
        "my_monthly_sessions": my_monthly_sessions,
        "total_monthly_sessions": total_monthly_sessions
    }