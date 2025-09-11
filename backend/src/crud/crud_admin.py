from sqlalchemy.orm import Session
from src.models import teacher, schedule, subject, group, practice, room, booking, announcement, activity_log
from src.crud import crud_workspace, crud_subject, crud_group
from src.schemas import admin as admin_schema
import os

def get_all_teachers_for_admin(db: Session):
    """
    Retrieves all teachers from the database for the admin list.
    """
    return db.query(teacher.Teacher).order_by(teacher.Teacher.teacher_name).all()

def get_full_teacher_details_for_admin(db: Session, teacher_id: int):
    """
    Aggregates all information for a single teacher for the admin detail view,
    now including detailed subject and group info.
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        return None

    teacher_schedule = crud_workspace.get_teacher_weekly_schedule(db, teacher_id=teacher_id)
    teacher_practices = crud_workspace.get_practices_for_teacher(db, teacher_id=teacher_id)

    simple_subjects = crud_workspace.get_subjects_by_teacher(db, teacher_id=teacher_id)
    simple_groups = crud_workspace.get_groups_by_teacher(db, teacher_id=teacher_id)

    detailed_subjects = [
        crud_workspace.get_subject_details_for_teacher(db, teacher_id=teacher_id, subject_id=s.subject_id)
        for s in simple_subjects
    ]
    detailed_groups = [
        crud_workspace.get_group_details_for_teacher(db, teacher_id=teacher_id, group_id=g.group_id)
        for g in simple_groups
    ]

    return {
        "teacher": db_teacher,
        "schedule": teacher_schedule,
        "subjects": [s for s in detailed_subjects if s],
        "groups": [g for g in detailed_groups if g],     
        "practices": teacher_practices,
    }

def delete_teacher_and_all_data(db: Session, teacher_id: int):
    """
    Deletes a teacher and all associated data, including practice files.
    This is a destructive operation.
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        return False

    practices_to_delete = db.query(practice.Practice).filter(practice.Practice.teacher_id == teacher_id).all()
    file_paths_to_delete = [p.file_url for p in practices_to_delete]

    db.query(announcement.Announcement).filter(announcement.Announcement.teacher_id == teacher_id).delete()
    db.query(activity_log.ActivityLog).filter(activity_log.ActivityLog.teacher_id == teacher_id).delete()
 
    for p in practices_to_delete:
        db.delete(p)
    db.query(schedule.Schedule).filter(schedule.Schedule.teacher_id == teacher_id).delete()
    
    db.delete(db_teacher)
    
    db.commit()

    for file_path in file_paths_to_delete:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete file {file_path}. Error: {e}")
    
    return True

def create_room(db: Session, room_name: str, capacity: int) -> room.Room:
    """Creates a new lab room."""
    db_room = room.Room(room_name=room_name, capacity=capacity)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def delete_room_and_bookings(db: Session, room_id: int) -> bool:
    """Deletes a room and all bookings associated with it."""
    db_room = db.query(room.Room).filter(room.Room.room_id == room_id).first()
    if not db_room:
        return False
    db.query(booking.Booking).filter(booking.Booking.room_id == room_id).delete()
    db.query(announcement.Announcement).filter(announcement.Announcement.room_id == room_id).delete()
    
    db.delete(db_room)
    db.commit()
    return True

def update_teacher_by_admin(db: Session, teacher_id: int, update_data: admin_schema.TeacherUpdateByAdmin):
    """
    Updates a teacher's profile, including their subjects, groups, and schedules.
    This function handles the complex logic of figuring out what was added, removed, or changed.
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        raise ValueError("Teacher not found")

    db_teacher.teacher_name = update_data.teacher_name
    db_teacher.email = update_data.email
    db_teacher.role = update_data.role
    db.add(db_teacher)

    current_schedules = db.query(schedule.Schedule).filter(schedule.Schedule.teacher_id == teacher_id).all()
 
    new_schedule_keys = set()
    for sub in update_data.subjects:
        db_subject = crud_subject.get_or_create_subject(db, subject_name=sub.subject_name)
        db.flush() 
        for grp in sub.groups:
            db_group = crud_group.get_or_create_group(db, group_name=grp.group_name)
            db.flush() 
            new_schedule_keys.add((db_subject.subject_id, db_group.group_id))

    schedules_to_delete = []
    for sch in current_schedules:
        if (sch.subject_id, sch.group_id) not in new_schedule_keys:
            schedules_to_delete.append(sch)
    
    practices_to_check = set()
    if schedules_to_delete:
        unique_schedules_to_delete = { (s.subject_id, s.group_id) for s in schedules_to_delete }

        for subject_id_to_del, group_id_to_del in unique_schedules_to_delete:
            related_practices = db.query(practice.Practice).filter(
                practice.Practice.teacher_id == teacher_id,
                practice.Practice.subject_id == subject_id_to_del
            ).all()
            for p in related_practices:
                db.query(booking.Booking).filter(
                    booking.Booking.practice_id == p.practice_id,
                    booking.Booking.group_id == group_id_to_del
                ).delete(synchronize_session=False)
                practices_to_check.add(p.practice_id)
            
    db.flush()
    if practices_to_check:
        for practice_id in practices_to_check:
            remaining_bookings = db.query(booking.Booking).filter(booking.Booking.practice_id == practice_id).count()
            if remaining_bookings == 0:
                practice_to_delete = db.query(practice.Practice).filter(practice.Practice.practice_id == practice_id).first()
                if practice_to_delete:
                    if practice_to_delete.file_url and os.path.exists(practice_to_delete.file_url):
                        os.remove(practice_to_delete.file_url)
                    db.delete(practice_to_delete)

    db.query(schedule.Schedule).filter(schedule.Schedule.teacher_id == teacher_id).delete(synchronize_session=False)
    db.flush()

    for sub in update_data.subjects:
        db_subject = db.query(subject.Subject).filter(subject.Subject.subject_name == sub.subject_name).first()
        for grp in sub.groups:
            db_group = db.query(group.Group).filter(group.Group.group_name == grp.group_name).first()
            for sch_item in grp.schedule:
                new_db_schedule = schedule.Schedule(
                    teacher_id=teacher_id,
                    subject_id=db_subject.subject_id,
                    group_id=db_group.group_id,
                    day_of_week=sch_item.day_of_week,
                    start_time=sch_item.start_time,
                    end_time=sch_item.end_time,
                    schedule_type=sch_item.schedule_type
                )
                db.add(new_db_schedule)
    
    db.commit()
    return db_teacher

def update_room(db: Session, room_id: int, room_in: admin_schema.RoomUpdate) -> room.Room | None:
    """Updates an existing lab room's details."""
    db_room = db.query(room.Room).filter(room.Room.room_id == room_id).first()
    if not db_room:
        return None
    
    db_room.room_name = room_in.room_name
    db_room.capacity = room_in.capacity
    db.commit()
    db.refresh(db_room)
    return db_room