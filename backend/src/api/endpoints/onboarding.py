from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas import onboarding as onboarding_schema
from src.crud import crud_teacher, crud_subject, crud_group, crud_schedule
from src.models.schedule import Schedule

router = APIRouter()

DAY_NAMES = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday"}

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

    try:
        from src.schemas.teacher import TeacherCreate
        teacher_create_data = TeacherCreate(
            teacher_name=onboarding_data.teacher_name,
            email=onboarding_data.email,
            password=onboarding_data.password
        )
        new_teacher = crud_teacher.create_teacher(db, teacher=teacher_create_data)
  
        db.flush()

        processed_groups = {}
     
        for subject_data in onboarding_data.subjects:
            db_subject = None
            if subject_data.subject_id:
                db_subject = crud_subject.get_subject_by_id(db, subject_id=subject_data.subject_id)
            if not db_subject:
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
                        end_time=schedule_item.end_time
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
            detail=f"An unexpected error occurred: {e}"
        )

    return {"message": "Teacher successfully onboarded."}