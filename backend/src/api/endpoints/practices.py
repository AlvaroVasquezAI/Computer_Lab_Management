from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Body
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from datetime import datetime, date, time
import json 
from fastapi.responses import FileResponse 
from src.crud import crud_workspace

from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.models.practice import Practice
from src.models.group import Group
from src.models.booking import Booking
from src.schemas import workspace as workspace_schema
from src.crud import crud_workspace

router = APIRouter()

UPLOADS_DIR = "/app/uploads"

@router.get("/subjects/{subject_id}/groups", response_model=List[workspace_schema.GroupForSubject])
def get_groups_for_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all groups and their schedules for a specific subject taught by the logged-in teacher.
    """
    return crud_workspace.get_groups_for_subject_by_teacher(db, teacher_id=current_teacher.teacher_id, subject_id=subject_id)

@router.post("/availability", response_model=List[workspace_schema.AvailableRoom])
def check_room_availability(
    request: workspace_schema.RoomAvailabilityRequest,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Check which rooms are available for a given date and time.
    """
    return crud_workspace.get_available_rooms(
        db, practice_date=request.practice_date, start_time=request.start_time, end_time=request.end_time
    )

@router.post("/practices", status_code=status.HTTP_201_CREATED)
def create_practice_and_bookings(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
    name: str = Form(...),
    objective: str = Form(...),
    subject_id: int = Form(...),
    bookings_data: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        bookings_to_create = json.loads(bookings_data)
        
        for booking_info in bookings_to_create:
            conflict = crud_workspace.check_group_booking_conflict(
                db=db,
                group_id=booking_info['group_id'],
                practice_date=date.fromisoformat(booking_info['date']),
                start_time=time.fromisoformat(booking_info['start_time']),
                end_time=time.fromisoformat(booking_info['end_time'])
            )
            if conflict:
                group_name = db.query(Group.group_name).filter(Group.group_id == booking_info['group_id']).scalar()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Schedule conflict: Group '{group_name}' is already booked on {booking_info['date']} at this time."
                )

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_name = "".join(c if c.isalnum() else "_" for c in name)
        filename = f"{timestamp}_{current_teacher.teacher_id}_{subject_id}_{safe_name}_{file.filename}"
        teacher_dir = os.path.join(UPLOADS_DIR, str(current_teacher.teacher_id))
        os.makedirs(teacher_dir, exist_ok=True)
        file_path_on_disk = os.path.join(teacher_dir, filename)
        with open(file_path_on_disk, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_practice = Practice(
            title=name,
            description=objective,
            file_url=file_path_on_disk,
            teacher_id=current_teacher.teacher_id,
            subject_id=subject_id
        )
        db.add(new_practice)
        db.flush()

        for booking_info in bookings_to_create:
            new_booking = Booking(
                practice_id=new_practice.practice_id,
                group_id=booking_info['group_id'],
                room_id=booking_info['room_id'],
                practice_date=date.fromisoformat(booking_info['date']),
                start_time=time.fromisoformat(booking_info['start_time']),
                end_time=time.fromisoformat(booking_info['end_time']),
                status='Scheduled'
            )
            db.add(new_booking)

        db.commit()

        return {"message": "Practice and bookings registered successfully."}

    except HTTPException as http_exc:
        db.rollback()
        raise http_exc 
    except Exception as e:
        db.rollback()
        if 'file_path_on_disk' in locals() and os.path.exists(file_path_on_disk):
            os.remove(file_path_on_disk)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    
@router.get("/practices", response_model=List[workspace_schema.PracticeListItem])
def get_teacher_practices(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a list of all practices registered by the logged-in teacher.
    """
    return crud_workspace.get_practices_for_teacher(db, teacher_id=current_teacher.teacher_id)


@router.get("/practices/{practice_id}/download")
def download_practice_file(
    practice_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Allows a teacher to download the file for a practice they own.
    """
    db_practice = db.query(Practice).filter(Practice.practice_id == practice_id).first()

    if not db_practice or db_practice.teacher_id != current_teacher.teacher_id:
        raise HTTPException(status_code=404, detail="Practice not found or you do not have permission to access it.")

    if not os.path.exists(db_practice.file_url):
        raise HTTPException(status_code=404, detail="File not found on the server.")

    return FileResponse(path=db_practice.file_url, media_type='application/octet-stream', filename=os.path.basename(db_practice.file_url))

@router.get("/practices/{practice_id}", response_model=workspace_schema.PracticeDetail)
def get_practice_details_endpoint(
    practice_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all details for a specific practice owned by the logged-in teacher.
    """
    details = crud_workspace.get_practice_details(db, practice_id=practice_id, teacher_id=current_teacher.teacher_id)
    if not details:
        raise HTTPException(status_code=404, detail="Practice not found.")
    return details

@router.get("/subjects/{subject_id}/bookings")
def get_subject_bookings(
    subject_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get existing bookings for a teacher and subject to disable dates on the frontend.
    """
    return crud_workspace.get_existing_bookings_for_subject(
        db, teacher_id=current_teacher.teacher_id, subject_id=subject_id
    )


@router.put("/practices/{practice_id}", status_code=status.HTTP_200_OK)
def update_practice(
    practice_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
    update_data_str: str = Form(...),
    file: UploadFile = File(None) 
):
    db_practice = db.query(Practice).filter(
        Practice.practice_id == practice_id,
        Practice.teacher_id == current_teacher.teacher_id
    ).first()

    if not db_practice:
        raise HTTPException(status_code=404, detail="Practice not found.")
    
    old_file_path = db_practice.file_url
    new_file_path_on_disk = None

    try:
        update_data: workspace_schema.PracticeUpdate = workspace_schema.PracticeUpdate.parse_raw(update_data_str)

        if file:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            safe_name = "".join(c if c.isalnum() else "_" for c in update_data.name)
            filename = f"{timestamp}_{current_teacher.teacher_id}_{update_data.subject_id}_{safe_name}_{file.filename}"
            teacher_dir = os.path.join(UPLOADS_DIR, str(current_teacher.teacher_id))
            os.makedirs(teacher_dir, exist_ok=True) 

            new_file_path_on_disk = os.path.join(teacher_dir, filename)
            with open(new_file_path_on_disk, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            db_practice.file_url = new_file_path_on_disk

        db_practice.title = update_data.name
        db_practice.description = update_data.objective
        db_practice.subject_id = update_data.subject_id

        crud_workspace.delete_future_bookings_for_practice(db, practice_id=practice_id)

        for booking_info in update_data.bookings:
            conflict = crud_workspace.check_group_booking_conflict(
                db=db,
                group_id=booking_info.group_id,
                practice_date=booking_info.practice_date,
                start_time=booking_info.start_time,
                end_time=booking_info.end_time
            )
            if conflict and conflict.practice_id != practice_id:
                group_name = db.query(Group.group_name).filter(Group.group_id == booking_info.group_id).scalar()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Schedule conflict: Group '{group_name}' is already booked for another practice at this time."
                )

            new_booking = Booking(
                practice_id=practice_id,
                group_id=booking_info.group_id,
                room_id=booking_info.room_id,
                practice_date=booking_info.practice_date,
                start_time=booking_info.start_time,
                end_time=booking_info.end_time,
                status='Scheduled'
            )
            db.add(new_booking)

        db.commit()

        if file and old_file_path and os.path.exists(old_file_path):
            os.remove(old_file_path)

        return {"message": "Practice updated successfully."}

    except Exception as e:
        db.rollback()
        if new_file_path_on_disk and os.path.exists(new_file_path_on_disk):
            os.remove(new_file_path_on_disk)
        
        raise e
    
@router.delete("/practices/{practice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_practice(
    practice_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    db_practice = db.query(Practice).filter(
        Practice.practice_id == practice_id,
        Practice.teacher_id == current_teacher.teacher_id
    ).first()
    if not db_practice:
        raise HTTPException(status_code=404, detail="Practice not found.")

    file_path_to_delete = db_practice.file_url

    try:
        db.delete(db_practice)
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(...)
    
    if file_path_to_delete and os.path.exists(file_path_to_delete):
        try:
            os.remove(file_path_to_delete)
        except Exception as e:
            print(f"Warning: Could not delete file {file_path_to_delete}. Error: {e}")
            
    return