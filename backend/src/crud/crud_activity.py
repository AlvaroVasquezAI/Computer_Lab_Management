from sqlalchemy.orm import Session
from sqlalchemy import extract
from collections import defaultdict
from src.models import booking, practice, group, room

def get_monthly_bookings_for_teacher(db: Session, teacher_id: int, year: int, month: int):
    """
    Fetches all bookings for a specific teacher for a given month and year.
    """
    bookings_query = (
        db.query(
            practice.Practice.title.label("practice_title"),
            group.Group.group_name,
            room.Room.room_name,
            booking.Booking.practice_date,
            booking.Booking.start_time,
            booking.Booking.end_time
        )
        .join(practice.Practice, booking.Booking.practice_id == practice.Practice.practice_id)
        .join(group.Group, booking.Booking.group_id == group.Group.group_id)
        .join(room.Room, booking.Booking.room_id == room.Room.room_id)
        .filter(
            practice.Practice.teacher_id == teacher_id,
            extract('year', booking.Booking.practice_date) == year,
            extract('month', booking.Booking.practice_date) == month
        )
        .order_by(booking.Booking.practice_date, booking.Booking.start_time)
        .all()
    )

    activities_by_date = defaultdict(list)
    for activity in bookings_query:
        activities_by_date[activity.practice_date].append(activity)

    result = [
        {"date": day, "bookings": activities}
        for day, activities in activities_by_date.items()
    ]
    
    return result