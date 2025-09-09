from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas import onboarding as onboarding_schema
from src.crud import crud_teacher, crud_subject, crud_group, crud_schedule, crud_room
from src.models.schedule import Schedule, ScheduleType
from datetime import datetime

router = APIRouter()

DAY_NAMES = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday"}
MAX_PRACTICE_DURATION_MINUTES = 90

@router.post("/teacher", status_code=status.HTTP_201_CREATED)
def onboard_new_teacher(
    onboarding_data: onboarding_schema.TeacherOnboarding,
    db: Session = Depends(get_db)
):
    db_teacher = crud_teacher.get_teacher_by_email(db, email=onboarding_data.email)
    if db_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A teacher with this email already exists."
        )

    total_rooms = crud_room.get_total_room_count(db)
    practice_slots_to_validate = []

    for subject_data in onboarding_data.subjects:
        for group_data in subject_data.groups:
            practice_count_for_this_group = 0
            for schedule_item in group_data.schedule:
                if schedule_item.schedule_type == ScheduleType.PRACTICE:
                    start_dt = datetime.combine(datetime.min, schedule_item.start_time)
                    end_dt = datetime.combine(datetime.min, schedule_item.end_time)
                    duration_minutes = (end_dt - start_dt).total_seconds() / 60
                    
                    if duration_minutes > MAX_PRACTICE_DURATION_MINUTES:
                        day_name = DAY_NAMES.get(schedule_item.day_of_week, "that day")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail={
                                "key": "error.practice_duration",
                                "params": {
                                    "group": group_data.group_name,
                                    "day": day_name,
                                    "max_minutes": MAX_PRACTICE_DURATION_MINUTES
                                }
                            }
                        )
                    
                    practice_count_for_this_group += 1
                    practice_slots_to_validate.append({
                        "day_of_week": schedule_item.day_of_week,
                        "start_time": schedule_item.start_time,
                        "end_time": schedule_item.end_time,
                        "subject_name": subject_data.subject_name,
                        "group_name": group_data.group_name
                    })

            if practice_count_for_this_group > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "key": "error.multiple_practices",
                        "params": {
                            "subject": subject_data.subject_name,
                            "group": group_data.group_name
                        }
                    }
                )

    grouped_slots = {}
    for slot in practice_slots_to_validate:
        slot_key = (slot["day_of_week"], slot["start_time"], slot["end_time"])
        if slot_key not in grouped_slots:
            grouped_slots[slot_key] = []
        grouped_slots[slot_key].append(slot)

    for slot_key, slots_in_payload in grouped_slots.items():
        day, start, end = slot_key
        conflicts_in_db = crud_schedule.count_conflicting_practices(
            db, day_of_week=day, start_time=start, end_time=end
        )
        count_in_payload = len(slots_in_payload)

        if (conflicts_in_db + count_in_payload) > total_rooms:
            conflicting_item = slots_in_payload[0]
            day_name = DAY_NAMES.get(day, "that day")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "key": "error.lab_conflict",
                    "params": {
                        "subject": conflicting_item['subject_name'],
                        "group": conflicting_item['group_name'],
                        "day": day_name,
                        "start_time": start.strftime('%H:%M'),
                        "end_time": end.strftime('%H:%M'),
                        "room_count": total_rooms
                    }
                }
            )

    try:
        from src.schemas.teacher import TeacherCreate
        teacher_create_data = TeacherCreate(
            teacher_name=onboarding_data.teacher_name,
            email=onboarding_data.email,
            password=onboarding_data.password
        )
        new_teacher = crud_teacher.create_teacher(db, teacher=teacher_create_data)
        db.flush()

        for subject_data in onboarding_data.subjects:
            db_subject = crud_subject.get_or_create_subject(db, subject_name=subject_data.subject_name)
            db.flush()

            for group_data in subject_data.groups:
                db_group = crud_group.get_or_create_group(db, group_name=group_data.group_name)
                db.flush()

                for schedule_item in group_data.schedule:
                    existing_schedules = crud_schedule.get_schedules_for_group_on_day(
                        db=db, group_id=db_group.group_id, day_of_week=schedule_item.day_of_week
                    )
                    for existing in existing_schedules:
                        if (schedule_item.start_time < existing.end_time and
                                existing.start_time < schedule_item.end_time):
                            day_name = DAY_NAMES.get(schedule_item.day_of_week, "that day")
                            raise HTTPException(
                                status_code=status.HTTP_409_CONFLICT,
                                detail=(
                                    f"Schedule conflict for group '{db_group.group_name}'. "
                                    f"The group is already busy on {day_name} from "
                                    f"{existing.start_time.strftime('%H:%M')} to {existing.end_time.strftime('%H:%M')}."
                                )
                            )
                    
                    db_schedule = Schedule(
                        teacher_id=new_teacher.teacher_id,
                        subject_id=db_subject.subject_id,
                        group_id=db_group.group_id,
                        day_of_week=schedule_item.day_of_week,
                        start_time=schedule_item.start_time,
                        end_time=schedule_item.end_time,
                        schedule_type=schedule_item.schedule_type
                    )
                    db.add(db_schedule)
        
        db.commit()
    except HTTPException as http_exc:
        db.rollback()
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during database operation: {e}"
        )

    return {"message": "Teacher successfully onboarded."}