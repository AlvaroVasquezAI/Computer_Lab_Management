from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from fastapi.responses import FileResponse

from typing import List
from pydantic import BaseModel
import os
from datetime import datetime
import shutil

from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher, UserRole
from src.crud import crud_admin, crud_data, crud_workspace, crud_dashboard
from src.schemas import admin as admin_schema, room as room_schema, workspace as workspace_schema
from src.models import practice as practice_model, schedule, teacher, booking

router = APIRouter()

class RoleUpdate(BaseModel):
    role: UserRole

def get_current_admin_user(current_user: Teacher = Depends(get_current_teacher)) -> Teacher:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

@router.get("/teachers", response_model=List[admin_schema.TeacherForAdminList], dependencies=[Depends(get_current_admin_user)])
def get_all_teachers(db: Session = Depends(get_db)):
    """
    Get a list of all teachers in the system. (Admin only)
    """
    return crud_admin.get_all_teachers_for_admin(db)

@router.get("/teachers/{teacher_id}", response_model=admin_schema.AdminTeacherDetail, dependencies=[Depends(get_current_admin_user)])
def get_teacher_details(teacher_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive details for a specific teacher. (Admin only)
    """
    details = crud_admin.get_full_teacher_details_for_admin(db, teacher_id=teacher_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return details

@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """
    Delete a teacher and all of their associated data. (Admin only)
    """
    success = crud_admin.delete_teacher_and_all_data(db, teacher_id=teacher_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return

@router.get("/rooms", response_model=List[room_schema.Room], dependencies=[Depends(get_current_admin_user)])
def get_all_rooms_admin(db: Session = Depends(get_db)):
    """
    Get a list of all rooms. (Admin only - using existing CRUD function)
    """
    return crud_data.get_rooms(db)

@router.post("/rooms", response_model=room_schema.Room, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
def create_new_room(room_in: admin_schema.RoomCreate, db: Session = Depends(get_db)):
    """
    Create a new computer lab room. (Admin only)
    """
    return crud_admin.create_room(db, room_name=room_in.room_name, capacity=room_in.capacity)

@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
def delete_room(room_id: int, db: Session = Depends(get_db)):
    """
    Delete a room and its associated bookings. (Admin only)
    """
    success = crud_admin.delete_room_and_bookings(db, room_id=room_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return

@router.put("/rooms/{room_id}", response_model=room_schema.Room, dependencies=[Depends(get_current_admin_user)])
def update_room_details(
    room_id: int,
    room_in: admin_schema.RoomUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a room's name and capacity. (Admin only)
    """
    updated_room = crud_admin.update_room(db, room_id=room_id, room_in=room_in)
    if not updated_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return updated_room

@router.get(
    "/teachers/{teacher_id}/subjects/{subject_id}",
    response_model=workspace_schema.SubjectDetail,
    dependencies=[Depends(get_current_admin_user)]
)
def get_subject_details_for_teacher_by_admin(
    teacher_id: int,
    subject_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific subject taught by a specific teacher. (Admin only)
    """
    details = crud_workspace.get_subject_details_for_teacher(
        db, teacher_id=teacher_id, subject_id=subject_id
    )
    if not details:
        raise HTTPException(status_code=404, detail="Subject not found or not taught by this teacher.")
    return details

@router.get(
    "/teachers/{teacher_id}/groups/{group_id}",
    response_model=workspace_schema.GroupDetailWithSubjects,
    dependencies=[Depends(get_current_admin_user)]
)
def get_group_details_for_teacher_by_admin(
    teacher_id: int,
    group_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific group taught by a specific teacher. (Admin only)
    """
    details = crud_workspace.get_group_details_for_teacher(
        db, teacher_id=teacher_id, group_id=group_id
    )
    if not details:
        raise HTTPException(status_code=404, detail="Group not found or not taught by this teacher.")
    return details

@router.get(
    "/practices/{practice_id}",
    response_model=workspace_schema.PracticeDetail,
    dependencies=[Depends(get_current_admin_user)]
)
def get_practice_details_by_admin(
    practice_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all details for a specific practice, regardless of owner. (Admin only)
    """
    db_practice = db.query(practice_model.Practice).filter(practice_model.Practice.practice_id == practice_id).first()
    if not db_practice:
        raise HTTPException(status_code=404, detail="Practice not found.")

    details = crud_workspace.get_practice_details(db, practice_id=practice_id, teacher_id=db_practice.teacher_id)
    if not details:
        raise HTTPException(status_code=404, detail="Practice details could not be retrieved.")
    return details


@router.get(
    "/practices/{practice_id}/download",
    dependencies=[Depends(get_current_admin_user)]
)
def download_practice_file_by_admin(
    practice_id: int,
    db: Session = Depends(get_db)
):
    """
    Allows an admin to download the file for any practice.
    """
    db_practice = db.query(practice_model.Practice).filter(practice_model.Practice.practice_id == practice_id).first()
    if not db_practice:
        raise HTTPException(status_code=404, detail="Practice not found.")

    if not os.path.exists(db_practice.file_url):
        raise HTTPException(status_code=404, detail="File not found on the server.")

    return FileResponse(path=db_practice.file_url, media_type='application/octet-stream', filename=os.path.basename(db_practice.file_url))

@router.delete(
    "/practices/{practice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_admin_user)]
)
def delete_practice_by_admin(
    practice_id: int,
    db: Session = Depends(get_db)
):
    """
    Allows an admin to delete any practice, even if it's in the past.
    """
    db_practice = db.query(practice_model.Practice).filter(practice_model.Practice.practice_id == practice_id).first()
    if not db_practice:
        raise HTTPException(status_code=404, detail="Practice not found.")

    file_path_to_delete = db_practice.file_url
    practice_title_to_log = db_practice.title
    owner_teacher_id = db_practice.teacher_id 

    try:
        db.delete(db_practice)
        db.commit()

        crud_dashboard.create_log_entry(db, teacher_id=owner_teacher_id, activity_type='DELETED', practice_title=practice_title_to_log)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
    if file_path_to_delete and os.path.exists(file_path_to_delete):
        try:
            os.remove(file_path_to_delete)
        except Exception as e:
            print(f"Warning: Could not delete file {file_path_to_delete}. Error: {e}")
            
    return

@router.get(
    "/teachers/{teacher_id}/subjects/{subject_id}/groups",
    response_model=List[workspace_schema.GroupForSubject],
    dependencies=[Depends(get_current_admin_user)]
)
def get_groups_for_subject_by_admin(
    teacher_id: int,
    subject_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all groups for a specific subject taught by a specific teacher. (Admin only)
    """
    return crud_workspace.get_groups_for_subject_by_teacher(
        db, teacher_id=teacher_id, subject_id=subject_id
    )

@router.get("/teachers/{teacher_id}/onboarding-data", response_model=admin_schema.TeacherUpdateByAdmin, dependencies=[Depends(get_current_admin_user)])
def get_teacher_data_for_edit(teacher_id: int, db: Session = Depends(get_db)):
    """
    Fetches a teacher's data formatted like the onboarding payload for easy editing. (Admin only)
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    schedules_by_subject = {}
    teacher_schedules = db.query(schedule.Schedule).options(
        joinedload(schedule.Schedule.subject),
        joinedload(schedule.Schedule.group)
    ).filter(schedule.Schedule.teacher_id == teacher_id).all()

    for sch in teacher_schedules:
        subject_name = sch.subject.subject_name
        if subject_name not in schedules_by_subject:
            schedules_by_subject[subject_name] = {}
        
        group_name = sch.group.group_name
        if group_name not in schedules_by_subject[subject_name]:
            schedules_by_subject[subject_name][group_name] = []
        
        schedules_by_subject[subject_name][group_name].append({
            "day_of_week": sch.day_of_week,
            "start_time": sch.start_time,
            "end_time": sch.end_time
        })
    
    subjects_list = []
    for subject_name, groups in schedules_by_subject.items():
        groups_list = []
        for group_name, schedule_items in groups.items():
            groups_list.append({"group_name": group_name, "schedule": schedule_items})
        subjects_list.append({"subject_name": subject_name, "groups": groups_list})
        
    return {
        "teacher_name": db_teacher.teacher_name,
        "email": db_teacher.email,
        "role": db_teacher.role,
        "subjects": subjects_list
    }

@router.put("/teachers/{teacher_id}", response_model=admin_schema.TeacherForAdminList, dependencies=[Depends(get_current_admin_user)])
def update_teacher_details(teacher_id: int, update_data: admin_schema.TeacherUpdateByAdmin, db: Session = Depends(get_db)):
    """
    Updates a teacher's full profile, including schedules. (Admin only)
    """
    try:
        updated_teacher = crud_admin.update_teacher_by_admin(db, teacher_id=teacher_id, update_data=update_data)
        return updated_teacher
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")
    
@router.put(
    "/practices/{practice_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(get_current_admin_user)]
)
def update_practice_by_admin(
    practice_id: int,
    db: Session = Depends(get_db),
    update_data_str: str = Form(...),
    file: UploadFile = File(None) 
):
    """
    Allows an admin to update any practice.
    This logic is adapted from the original practices.py endpoint but without the ownership check.
    """
    db_practice = db.query(practice_model.Practice).filter(
        practice_model.Practice.practice_id == practice_id
    ).first()

    if not db_practice:
        raise HTTPException(status_code=404, detail="Practice not found.")

    owner_teacher = db_practice.teacher
    old_file_path = db_practice.file_url
    new_file_path_on_disk = None
    original_title = db_practice.title

    try:
        update_data: workspace_schema.PracticeUpdate = workspace_schema.PracticeUpdate.parse_raw(update_data_str)

        if file:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            safe_name = "".join(c if c.isalnum() else "_" for c in update_data.name)
            filename = f"{timestamp}_{owner_teacher.teacher_id}_{update_data.subject_id}_{safe_name}_{file.filename}"
            teacher_dir = os.path.join("/app/uploads", str(owner_teacher.teacher_id))
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
            new_booking = booking.Booking(
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

        return {"message": "Practice updated successfully by admin."}

    except Exception as e:
        db.rollback()
        if new_file_path_on_disk and os.path.exists(new_file_path_on_disk):
            os.remove(new_file_path_on_disk)
        raise e
    
@router.patch(
    "/teachers/{teacher_id}/role",
    response_model=admin_schema.TeacherForAdminList,
    dependencies=[Depends(get_current_admin_user)]
)
def update_teacher_role(
    teacher_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates a single teacher's role. (Admin only)
    """
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    db_teacher.role = role_update.role
    db.commit()
    db.refresh(db_teacher)
    
    return db_teacher