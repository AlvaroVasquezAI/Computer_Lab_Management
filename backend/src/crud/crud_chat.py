from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models import subject, schedule, group, practice, booking, teacher
from datetime import date
import yaml 

def get_schedule_for_subject_by_teacher(db: Session, teacher_id: int, subject_name: str | None) -> str:
    """
    Finds the complete schedule. If subject_name is provided, it filters for that subject.
    If subject_name is None, it returns the full weekly schedule for the teacher.
    """
    query = db.query(schedule.Schedule).join(group.Group).join(subject.Subject).filter(
        schedule.Schedule.teacher_id == teacher_id
    )
    
    if subject_name:
        db_subject_obj = db.query(subject.Subject).filter(func.lower(subject.Subject.subject_name) == func.lower(subject_name)).first()
        if not db_subject_obj:
            return f"The teacher does not seem to be associated with a subject named '{subject_name}'."
        query = query.filter(schedule.Schedule.subject_id == db_subject_obj.subject_id)
    
    schedules_result = query.order_by(schedule.Schedule.day_of_week, schedule.Schedule.start_time).all()

    if not schedules_result:
        return f"No schedule found." if not subject_name else f"No schedule found for the subject '{subject_name}'."
    
    day_map = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday"}
    schedule_lines = [
        f"- {s.subject.subject_name}: {day_map.get(s.day_of_week, 'Unknown Day')} from {s.start_time.strftime('%H:%M')} to {s.end_time.strftime('%H:%M')} with {s.group.group_name}"
        for s in schedules_result
    ]
    
    if subject_name:
        return f"The schedule for '{subject_name}' is:\n" + "\n".join(schedule_lines)
    else:
        return "\n".join(schedule_lines)

def get_full_teacher_profile(db: Session, teacher_id: int) -> dict:
    """
    Gathers a comprehensive but safe dictionary of all information
    related to a specific teacher.
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        return {}

    subjects_result = db.query(subject.Subject).join(schedule.Schedule).filter(
        schedule.Schedule.teacher_id == teacher_id
    ).distinct().all()
    
    groups_result = db.query(group.Group).join(schedule.Schedule).filter(
        schedule.Schedule.teacher_id == teacher_id
    ).distinct().all()
    
    practices_result = db.query(practice.Practice).filter(practice.Practice.teacher_id == teacher_id).all()

    full_schedule_str = get_schedule_for_subject_by_teacher(db, teacher_id, None)

    return {
        "name": db_teacher.teacher_name,
        "email": db_teacher.email,
        "total_subjects": len(subjects_result),
        "subject_names": [s.subject_name for s in subjects_result],
        "total_groups": len(groups_result),
        "group_names": [g.group_name for g in groups_result],
        "total_practices": len(practices_result),
        "practice_titles": [p.title for p in practices_result],
        "full_schedule": full_schedule_str
    }

def get_full_teacher_profile(db: Session, teacher_id: int) -> str:
    """
    Gathers a comprehensive but safe profile of the teacher and formats it as a YAML string.
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        return "No teacher data found."

    subjects_result = db.query(subject.Subject).join(schedule.Schedule).filter(
        schedule.Schedule.teacher_id == teacher_id).distinct().all()
    
    groups_result = db.query(group.Group).join(schedule.Schedule).filter(
        schedule.Schedule.teacher_id == teacher_id).distinct().all()
    
    practices_result = db.query(practice.Practice).filter(practice.Practice.teacher_id == teacher_id).all()

    profile_data = {
        "name": db_teacher.teacher_name,
        "email": db_teacher.email,
        "total_subjects": len(subjects_result),
        "subject_names": [s.subject_name for s in subjects_result],
        "total_groups": len(groups_result),
        "group_names": [g.group_name for g in groups_result],
        "total_practices": len(practices_result)
    }

    return yaml.dump(profile_data, allow_unicode=True, default_flow_style=False)

def get_practice_status_counts(db: Session, teacher_id: int) -> str:
    """
    Counts how many of the teacher's practices have already passed and how many are upcoming.
    """
    today = date.today()
    
    practice_dates = db.query(booking.Booking.practice_date).join(practice.Practice).filter(
        practice.Practice.teacher_id == teacher_id
    ).distinct().all()

    if not practice_dates:
        return "The teacher has no scheduled practices."

    past_practices_count = sum(1 for pd, in practice_dates if pd < today)
    upcoming_practices_count = sum(1 for pd, in practice_dates if pd >= today)

    return f"The teacher has {past_practices_count} practices whose sessions have passed and {upcoming_practices_count} practices with upcoming sessions."