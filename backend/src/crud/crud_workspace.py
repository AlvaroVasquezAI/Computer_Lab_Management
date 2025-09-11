from datetime import date, datetime, time
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from src.models import schedule, subject, group, practice, room, booking
from collections import defaultdict
from calendar import monthrange

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
    results = []
    for p_id, p_title, s_name, p_date in practices_query:
        earliest_start = db.query(
            func.min(func.concat(booking.Booking.practice_date, ' ', booking.Booking.start_time))
        ).filter(booking.Booking.practice_id == p_id).scalar()

        latest_end = db.query(
            func.max(func.concat(booking.Booking.practice_date, ' ', booking.Booking.end_time))
        ).filter(booking.Booking.practice_id == p_id).scalar()

        results.append({
            "practice_id": p_id,
            "title": p_title,
            "subject_name": s_name,
            "created_at": p_date,
            "earliest_session_start": earliest_start, # e.g., "2025-08-28 09:00:00" or None
            "latest_session_end": latest_end,       # e.g., "2025-09-02 15:30:00" or None
        })
    return results

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
        "teacher_id": db_practice.teacher_id,
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
    """
    Checks if a practice is editable. A practice is editable as long as the end time
    of its latest scheduled session is in the future.
    """
    latest_booking = db.query(booking.Booking).filter(
        booking.Booking.practice_id == practice_id
    ).order_by(
        booking.Booking.practice_date.desc(),
        booking.Booking.end_time.desc()
    ).first()

    if not latest_booking:
        return True 

    now = datetime.utcnow()
    today_utc = now.date()
    now_time_utc = now.time()

    booking_date = latest_booking.practice_date
    booking_end_time = latest_booking.end_time

    if booking_date > today_utc:
        return True

    if booking_date < today_utc:
        return False

    return booking_end_time > now_time_utc

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

def is_practice_deletable(db: Session, practice_id: int) -> bool:
    """
    Checks if a practice can be deleted. A practice is deletable only if the start
    time of its earliest scheduled session is in the future.
    """
    earliest_booking = db.query(booking.Booking).filter(
        booking.Booking.practice_id == practice_id
    ).order_by(
        booking.Booking.practice_date.asc(),
        booking.Booking.start_time.asc()
    ).first()

    if not earliest_booking:
        return True 

    now = datetime.utcnow()
    today_utc = now.date()
    now_time_utc = now.time()

    booking_date = earliest_booking.practice_date
    booking_start_time = earliest_booking.start_time

    if booking_date > today_utc:
        return True
    
    if booking_date < today_utc:
        return False

    return booking_start_time > now_time_utc

def get_teacher_weekly_schedule(db: Session, teacher_id: int):
    """
    Fetches the full weekly schedule for a teacher, organized by day of the week.
    NOW INCLUDES the schedule_type (CLASS or PRACTICE).
    """
    schedules_query = (
        db.query(
            schedule.Schedule.day_of_week,
            schedule.Schedule.start_time,
            schedule.Schedule.end_time,
            subject.Subject.subject_name,
            group.Group.group_name,
            group.Group.group_id,
            schedule.Schedule.schedule_type  
        )
        .join(subject.Subject, schedule.Schedule.subject_id == subject.Subject.subject_id)
        .join(group.Group, schedule.Schedule.group_id == group.Group.group_id)
        .filter(schedule.Schedule.teacher_id == teacher_id)
        .order_by(schedule.Schedule.day_of_week, schedule.Schedule.start_time)
        .all()
    )

    weekly_schedule = {
        1: [], 2: [], 3: [], 4: [], 5: []
    }

    for item in schedules_query:
        if item.day_of_week in weekly_schedule:
            weekly_schedule[item.day_of_week].append({
                "start_time": item.start_time,
                "end_time": item.end_time,
                "subject_name": item.subject_name,
                "group_name": item.group_name,
                "group_id": item.group_id,
                "schedule_type": item.schedule_type
            })

    day_map = {1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday"}
    return {day_map[day]: schedule_list for day, schedule_list in weekly_schedule.items()}

def count_practices_for_subject(db: Session, teacher_id: int, subject_name: str) -> str:
    """
    Counts how many practices a teacher has for a specific subject, identified by its name.
    """
    db_subject = db.query(subject.Subject).filter(func.lower(subject.Subject.subject_name) == func.lower(subject_name)).first()
    
    if not db_subject:
        return f"Subject '{subject_name}' not found for this teacher."

    practice_count = db.query(func.count(practice.Practice.practice_id)).filter(
        practice.Practice.teacher_id == teacher_id,
        practice.Practice.subject_id == db_subject.subject_id
    ).scalar() or 0

    return f"The teacher has {practice_count} practices for the subject '{subject_name}'."

def get_monthly_practice_progress(db: Session, teacher_id: int):
    """
    Calculates the number of completed practices vs. the total goal for the current month,
    for each subject taught by the teacher, with a breakdown per group.
    """
    
    def count_specific_days_in_month(year, month, day_of_week):
        python_day_of_week = day_of_week - 1
        count = 0
        num_days_in_month = monthrange(year, month)[1]
        for day_num in range(1, num_days_in_month + 1):
            if date(year, month, day_num).weekday() == python_day_of_week:
                count += 1
        return count

    today = date.today()
    current_year = today.year
    current_month = today.month
    start_of_month = date(current_year, current_month, 1)
    
    final_results = []
    teacher_subjects = get_subjects_by_teacher(db, teacher_id=teacher_id)

    for subj in teacher_subjects:
        groups_for_subject = db.query(group.Group).join(schedule.Schedule).filter(
            schedule.Schedule.teacher_id == teacher_id,
            schedule.Schedule.subject_id == subj.subject_id
        ).distinct().all()

        groups_progress_list = []
        subject_total_goal = 0
        subject_total_completed = 0

        for grp in groups_for_subject:
            group_goal = 0
            practice_schedules = db.query(schedule.Schedule).filter(
                schedule.Schedule.teacher_id == teacher_id,
                schedule.Schedule.subject_id == subj.subject_id,
                schedule.Schedule.group_id == grp.group_id,
                schedule.Schedule.schedule_type == schedule.ScheduleType.PRACTICE
            ).all()
            
            for sched in practice_schedules:
                num_days = count_specific_days_in_month(current_year, current_month, sched.day_of_week)
                group_goal += num_days

            group_completed = db.query(func.count(booking.Booking.booking_id)).join(
                practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id
            ).filter(
                practice.Practice.teacher_id == teacher_id,
                practice.Practice.subject_id == subj.subject_id,
                booking.Booking.group_id == grp.group_id,
                booking.Booking.practice_date >= start_of_month,
                booking.Booking.practice_date < today
            ).scalar() or 0

            if group_goal > 0:
                groups_progress_list.append({
                    "group_name": grp.group_name,
                    "completed_count": group_completed,
                    "total_goal": group_goal
                })
                subject_total_goal += group_goal
                subject_total_completed += group_completed
        
        if subject_total_goal > 0:
            final_results.append({
                "subject_name": subj.subject_name,
                "total_completed": subject_total_completed,
                "total_goal": subject_total_goal,
                "groups_progress": groups_progress_list
            })

    return final_results