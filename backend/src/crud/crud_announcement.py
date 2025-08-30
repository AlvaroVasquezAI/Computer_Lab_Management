from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from src.models import announcement, teacher, room, group
from src.schemas.dashboard import AnnouncementUpdate

def get_announcement_by_id(db: Session, announcement_id: int):
    return db.query(announcement.Announcement).filter(announcement.Announcement.announcement_id == announcement_id).first()

def get_announcements_with_filters(
    db: Session,
    time_filter: str,
    teacher_id_filter: int | None
):
    query = db.query(announcement.Announcement).join(
        teacher.Teacher
    ).outerjoin(room.Room).outerjoin(group.Group)

    if teacher_id_filter:
        query = query.filter(announcement.Announcement.teacher_id == teacher_id_filter)

    if time_filter == 'day':
        today = date.today()
        query = query.filter(func.date(announcement.Announcement.created_at) == today)
    elif time_filter == 'month':
        current_month = datetime.now().month
        current_year = datetime.now().year
        query = query.filter(
            func.extract('month', announcement.Announcement.created_at) == current_month,
            func.extract('year', announcement.Announcement.created_at) == current_year
        )
    
    return query.order_by(announcement.Announcement.created_at.desc()).all()

def update_announcement(db: Session, db_announcement: announcement.Announcement, announcement_in: AnnouncementUpdate):
    db_announcement.description = announcement_in.description
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

def delete_announcement(db: Session, db_announcement: announcement.Announcement):
    db.delete(db_announcement)
    db.commit()