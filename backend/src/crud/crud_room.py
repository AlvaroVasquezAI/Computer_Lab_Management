from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from datetime import date, timedelta
from collections import defaultdict
from src.models import booking, practice, teacher, group
import math

def get_bookings_for_room_on_date(db: Session, room_id: int, target_date: date):
    return (
        db.query(booking.Booking)
        .options(
            joinedload(booking.Booking.practice).joinedload(practice.Practice.teacher),
            joinedload(booking.Booking.group),
        )
        .filter(
            booking.Booking.room_id == room_id,
            booking.Booking.practice_date == target_date
        )
        .order_by(booking.Booking.start_time)
        .all()
    )

def get_monthly_availability_for_room(db: Session, room_id: int, year: int, month: int):
    query_filter = text(
        f"EXTRACT(YEAR FROM practice_date) = {year} AND EXTRACT(MONTH FROM practice_date) = {month}"
    )

    bookings_in_month = (
        db.query(
            booking.Booking.practice_date,
            booking.Booking.start_time,
            booking.Booking.end_time
        )
        .filter(
            booking.Booking.room_id == room_id,
            query_filter
        )
        .all()
    )

    daily_slot_counts = defaultdict(int)

    for b in bookings_in_month:
        start_td = timedelta(hours=b.start_time.hour, minutes=b.start_time.minute)
        end_td = timedelta(hours=b.end_time.hour, minutes=b.end_time.minute)
        duration_minutes = (end_td - start_td).total_seconds() / 60
        
        if duration_minutes > 0:
            num_slots = math.ceil(duration_minutes / 30)
            day_of_month = b.practice_date.day
            daily_slot_counts[day_of_month] += num_slots
            
    return dict(daily_slot_counts)