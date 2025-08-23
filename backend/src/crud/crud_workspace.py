from datetime import date, datetime, time, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from src.models import schedule, subject, group, practice, teacher
from collections import defaultdict
from src.models import room, booking, group

def get_subjects_by_teacher(db: Session, teacher_id: int):
    """
    Gets all unique subjects taught by a specific teacher.
    """
    subject_ids = db.query(distinct(schedule.Schedule.subject_id)).filter(schedule.Schedule.teacher_id == teacher_id).all()
    subject_ids = [s_id for s_id, in subject_ids] 
    return db.query(subject.Subject).filter(subject.Subject.subject_id.in_(subject_ids)).order_by(subject.Subject.subject_name).all()

def get_groups_by_teacher(db: Session, teacher_id: int):
    """
    Gets all unique groups taught by a specific teacher.
    """
    group_ids = db.query(distinct(schedule.Schedule.group_id)).filter(schedule.Schedule.teacher_id == teacher_id).all()
    group_ids = [g_id for g_id, in group_ids] 
    return db.query(group.Group).filter(group.Group.group_id.in_(group_ids)).order_by(group.Group.group_name).all()

def get_practice_stats_by_teacher(db: Session, teacher_id: int):
    """
    Gets the count of practices for each subject taught by a specific teacher.
    """
    stats = (
        db.query(
            subject.Subject.subject_name,
            func.count(practice.Practice.practice_id).label("practice_count")
        )
        .join(practice.Practice, subject.Subject.subject_id == practice.Practice.subject_id)
        .filter(practice.Practice.teacher_id == teacher_id)
        .group_by(subject.Subject.subject_name)
        .order_by(subject.Subject.subject_name)
        .all()
    )
    return stats

def get_subject_details_for_teacher(db: Session, teacher_id: int, subject_id: int):
    """
    Gathers detailed information about a specific subject for a specific teacher,
    including groups, schedules, and practice counts.
    """
    db_subject = db.query(subject.Subject).filter(subject.Subject.subject_id == subject_id).first()
    if not db_subject:
        return None

    practice_count = db.query(func.count(practice.Practice.practice_id)).filter(
        practice.Practice.teacher_id == teacher_id,
        practice.Practice.subject_id == subject_id
    ).scalar() or 0

    schedules_query = (
        db.query(schedule.Schedule, group.Group.group_name)
        .join(group.Group, schedule.Schedule.group_id == group.Group.group_id)
        .filter(
            schedule.Schedule.teacher_id == teacher_id,
            schedule.Schedule.subject_id == subject_id
        )
        .order_by(group.Group.group_name, schedule.Schedule.day_of_week)
        .all()
    )

    groups_data = defaultdict(list)
    for schedule_entry, group_name in schedules_query:
        groups_data[group_name].append(schedule_entry)

    response = {
        "subject_id": db_subject.subject_id,
        "subject_name": db_subject.subject_name,
        "total_practice_count": practice_count,
        "groups": [
            {"group_name": name, "schedules": schedules_list}
            for name, schedules_list in groups_data.items()
        ]
    }
    return response

def get_group_details_for_teacher(db: Session, teacher_id: int, group_id: int):
    """
    Gathers detailed information about a specific group for a specific teacher,
    including subjects, schedules, and practice counts.
    """
    db_group = db.query(group.Group).filter(group.Group.group_id == group_id).first()
    if not db_group:
        return None

    subject_ids_for_group = db.query(distinct(schedule.Schedule.subject_id)).filter(
        schedule.Schedule.teacher_id == teacher_id,
        schedule.Schedule.group_id == group_id
    ).all()
    subject_ids_for_group = [s_id for s_id, in subject_ids_for_group]

    practice_count = db.query(func.count(practice.Practice.practice_id)).filter(
        practice.Practice.teacher_id == teacher_id,
        practice.Practice.subject_id.in_(subject_ids_for_group)
    ).scalar() or 0

    schedules_query = (
        db.query(schedule.Schedule, subject.Subject.subject_name)
        .join(subject.Subject, schedule.Schedule.subject_id == subject.Subject.subject_id)
        .filter(
            schedule.Schedule.teacher_id == teacher_id,
            schedule.Schedule.group_id == group_id
        )
        .order_by(subject.Subject.subject_name, schedule.Schedule.day_of_week)
        .all()
    )

    subjects_data = defaultdict(list)
    for schedule_entry, subject_name in schedules_query:
        subjects_data[subject_name].append(schedule_entry)

    response = {
        "group_id": db_group.group_id,
        "group_name": db_group.group_name,
        "total_practice_count": practice_count,
        "subjects": [
            {"subject_name": name, "schedules": schedules_list}
            for name, schedules_list in subjects_data.items()
        ]
    }
    return response

def get_groups_for_subject_by_teacher(db: Session, teacher_id: int, subject_id: int):
    """
    Finds all groups a teacher has for a specific subject and includes their schedules.
    """
    group_ids_query = db.query(distinct(schedule.Schedule.group_id)).filter(
        schedule.Schedule.teacher_id == teacher_id,
        schedule.Schedule.subject_id == subject_id
    ).all()
    group_ids = [g_id for g_id, in group_ids_query]

    groups_list = db.query(group.Group).filter(group.Group.group_id.in_(group_ids)).all()

    for g in groups_list:
        g.schedules = db.query(schedule.Schedule).filter(
            schedule.Schedule.teacher_id == teacher_id,
            schedule.Schedule.subject_id == subject_id,
            schedule.Schedule.group_id == g.group_id
        ).all()
        
    return groups_list


def get_available_rooms(db: Session, practice_date: date, start_time: time, end_time: time):
    """
    Finds all rooms that are NOT booked during a specific date and time interval.
    """
    busy_room_ids = db.query(booking.Booking.room_id).filter(
        booking.Booking.practice_date == practice_date,
        booking.Booking.start_time < end_time,
        booking.Booking.end_time > start_time
    ).all()
    busy_room_ids = [r_id for r_id, in busy_room_ids]

    return db.query(room.Room).filter(room.Room.room_id.notin_(busy_room_ids)).all()

def get_practices_for_teacher(db: Session, teacher_id: int):
    practices_query = (
        db.query(
            practice.Practice.practice_id,
            practice.Practice.title,
            subject.Subject.subject_name,
            practice.Practice.created_at
        )
        .join(subject.Subject, practice.Practice.subject_id == subject.Subject.subject_id)
        .filter(practice.Practice.teacher_id == teacher_id)
        .order_by(practice.Practice.created_at.desc())
        .all()
    )
    return [
        {
            "practice_id": p_id,
            "title": p_title,
            "subject_name": s_name,
            "created_at": p_date,
            "is_editable": is_practice_editable(db, practice_id=p_id, teacher_id=teacher_id)
        }
        for p_id, p_title, s_name, p_date in practices_query
    ]

def get_practice_details(db: Session, practice_id: int, teacher_id: int):
    db_practice = db.query(practice.Practice).filter(
        practice.Practice.practice_id == practice_id,
        practice.Practice.teacher_id == teacher_id
    ).first()

    if not db_practice:
        return None

    subj_name = db.query(subject.Subject.subject_name).filter(subject.Subject.subject_id == db_practice.subject_id).scalar()
    
    bookings_query = (
        db.query(
            group.Group.group_name,
            room.Room.room_name,
            room.Room.room_id,
            booking.Booking.practice_date,
            booking.Booking.start_time,
            booking.Booking.end_time
        )
        .join(group.Group, booking.Booking.group_id == group.Group.group_id)
        .join(room.Room, booking.Booking.room_id == room.Room.room_id)
        .filter(booking.Booking.practice_id == practice_id)
        .all()
    )

    return {
        "practice_id": db_practice.practice_id,
        "title": db_practice.title,
        "description": db_practice.description,
        "subject_name": subj_name,
        "subject_id": db_practice.subject_id, 
        "created_at": db_practice.created_at,
        "file_url": db_practice.file_url,
        "bookings": [
            { "group_name": b.group_name, "room_name": b.room_name, "room_id": b.room_id, "practice_date": b.practice_date, "start_time": b.start_time, "end_time": b.end_time } 
            for b in bookings_query
        ]
    }

def check_group_booking_conflict(db: Session, group_id: int, practice_date: date, start_time: time, end_time: time):
    """
    Checks if a booking already exists for a given group that overlaps with the specified time.
    Returns the conflicting booking if found, otherwise None.
    """
    conflict = db.query(booking.Booking).join(group.Group).filter(
        booking.Booking.group_id == group_id,
        booking.Booking.practice_date == practice_date,
        booking.Booking.start_time < end_time,
        booking.Booking.end_time > start_time
    ).first()
    
    return conflict

def get_existing_bookings_for_subject(db: Session, teacher_id: int, subject_id: int):
    """
    Finds all dates where a teacher has already made a booking for a specific subject.
    """
    bookings = db.query(booking.Booking.practice_date, booking.Booking.group_id).join(
        practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id
    ).filter(
        practice.Practice.teacher_id == teacher_id,
        practice.Practice.subject_id == subject_id
    ).all()
    
    return [{"date": str(b.practice_date), "group_id": b.group_id} for b in bookings]

def delete_bookings_for_practice(db: Session, practice_id: int):
    """Deletes all bookings associated with a given practice ID."""
    db.query(booking.Booking).filter(booking.Booking.practice_id == practice_id).delete()

def is_practice_editable(db: Session, practice_id: int, teacher_id: int) -> bool:
    latest_end_datetime = db.query(
        func.max(func.concat(booking.Booking.practice_date, ' ', booking.Booking.end_time))
    ).join(
        practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id
    ).filter(
        practice.Practice.practice_id == practice_id,
        practice.Practice.teacher_id == teacher_id
    ).scalar()

    if not latest_end_datetime:
        return True 

    end_datetime = datetime.strptime(latest_end_datetime, '%Y-%m-%d %H:%M:%S')
    
    return end_datetime > datetime.utcnow()

def delete_future_bookings_for_practice(db: Session, practice_id: int):
    """
    Deletes bookings for a practice that are scheduled for today or a future date.
    Past bookings are preserved.
    """
    today = date.today()
    db.query(booking.Booking).filter(
        booking.Booking.practice_id == practice_id,
        booking.Booking.practice_date >= today
    ).delete()