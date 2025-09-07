from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr 
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io
import csv
from datetime import date
import os
import re
from typing import List

from src.database import get_db
from src.api.endpoints.admin import get_current_admin_user
from src.crud import crud_export, crud_teacher, crud_room, crud_subject, crud_group
from src.services import email_service

router = APIRouter()

def sanitize_filename(name: str) -> str:
    """Replaces spaces with underscores and removes invalid filename characters."""
    name = name.replace(' ', '_')
    name = re.sub(r'[^\w-]', '', name)
    return name

def create_csv_response(data: list, headers: list, filename: str) -> StreamingResponse:
    """Helper function to generate a StreamingResponse with CSV data."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(data)
 
    response_headers = {
        "Content-Disposition": f"attachment; filename={filename}",
        "Access-Control-Expose-Headers": "Content-Disposition"
    }
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=response_headers
    )

@router.get(
    "/practices/all",
    dependencies=[Depends(get_current_admin_user)],
    summary="Export all completed practice sessions to a CSV file."
)
def export_all_completed_practices(db: Session = Depends(get_db)):
    """Exports a comprehensive list of all historical practice data."""
    results = crud_export.all_completed(db)
    
    headers = [
        "Practice ID", "Practice Name", "Teacher Name", "Subject", "Group", "Room",
        "Date", "Start Time", "End Time", "File Name"
    ]
    
    formatted_data = [
        [
            p.practice_id, p.practice_name, p.teacher_name, p.subject_name, p.group_name,
            p.room_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)
        ] for p in results
    ]
    
    today_str = date.today().strftime("%Y%m%d")
    filename = f"All_Completed_Practices_{today_str}.csv"
    
    return create_csv_response(formatted_data, headers, filename)

@router.get(
    "/practices",
    dependencies=[Depends(get_current_admin_user)],
    summary="Export completed practice sessions to a CSV file."
)
def export_completed_practices_to_csv(
    by: str = Query(..., enum=["teacher", "room", "subject", "group"]),
    id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Exports historical practice data based on a specified filter."""
    today_str = date.today().strftime("%Y%m%d")

    if by == "teacher":
        db_teacher = crud_teacher.get_teacher_by_id(db, teacher_id=id)
        if not db_teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        results = crud_export.by_teacher(db, teacher_id=id)
        headers = ["Practice ID", "Practice Name", "Subject", "Group", "Room", "Date", "Start Time", "End Time", "File Name"]
        filename = f"{sanitize_filename(db_teacher.teacher_name)}_{today_str}.csv"
        
        data = [[p.practice_id, p.practice_name, p.subject_name, p.group_name, p.room_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]
        return create_csv_response(data, headers, filename)

    elif by == "room":
        db_room = crud_room.get_room_by_id(db, room_id=id)
        if not db_room:
            raise HTTPException(status_code=404, detail="Room not found")
        results = crud_export.by_room(db, room_id=id)
        headers = ["Teacher Name", "Teacher ID", "Practice ID", "Practice Name", "Subject", "Group", "Date", "Start Time", "End Time", "File Name"]
        filename = f"{sanitize_filename(db_room.room_name)}_{today_str}.csv"
        
        data = [[p.teacher_name, p.teacher_id, p.practice_id, p.practice_name, p.subject_name, p.group_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]
        return create_csv_response(data, headers, filename)

    elif by == "subject":
        db_subject = crud_subject.get_subject_by_id(db, subject_id=id)
        if not db_subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        results = crud_export.by_subject(db, subject_id=id)
        headers = ["Teacher Name", "Teacher ID", "Practice ID", "Practice Name", "Room", "Group", "Date", "Start Time", "End Time", "File Name"]
        filename = f"{sanitize_filename(db_subject.subject_name)}_{today_str}.csv"

        data = [[p.teacher_name, p.teacher_id, p.practice_id, p.practice_name, p.room_name, p.group_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]
        return create_csv_response(data, headers, filename)

    elif by == "group":
        db_group = crud_group.get_group_by_id(db, group_id=id)
        if not db_group:
            raise HTTPException(status_code=404, detail="Group not found")
        results = crud_export.by_group(db, group_id=id)
        headers = ["Teacher Name", "Teacher ID", "Practice ID", "Practice Name", "Room", "Subject", "Date", "Start Time", "End Time", "File Name"]
        filename = f"{sanitize_filename(db_group.group_name)}_{today_str}.csv"

        data = [[p.teacher_name, p.teacher_id, p.practice_id, p.practice_name, p.room_name, p.subject_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]
        return create_csv_response(data, headers, filename)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 'by' parameter")

class EmailExportRequest(BaseModel):
    recipients: List[EmailStr]
    export_title: str
    lang: str

@router.post(
    "/practices/send-email",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(get_current_admin_user)],
    summary="Generate and email a CSV report of completed practices."
)
def send_export_email_endpoint(
    request: EmailExportRequest,
    by: str = Query(..., enum=["teacher", "room", "subject", "group", "all"]),
    id: int = Query(None),
    db: Session = Depends(get_db)
):
    """
    Generates a CSV of historical practice data and emails it to a list of recipients.
    - **by**: The entity to filter by (`teacher`, `room`, `subject`, `group`, or `all`).
    - **id**: The ID of the entity to filter by (not required for 'all').
    """
    if by != "all" and id is None:
        raise HTTPException(status_code=400, detail="ID is required unless exporting 'all'.")

    data_for_csv = []
    headers = []
    filename_base = "export"

    if by == "all":
        results = crud_export.all_completed(db)
        headers = ["Practice ID", "Practice Name", "Teacher Name", "Subject", "Group", "Room", "Date", "Start Time", "End Time", "File Name"]
        filename_base = "All_Completed_Practices"
        data_for_csv = [[p.practice_id, p.practice_name, p.teacher_name, p.subject_name, p.group_name, p.room_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]

    elif by == "teacher":
        db_teacher = crud_teacher.get_teacher_by_id(db, teacher_id=id)
        if not db_teacher: raise HTTPException(status_code=404, detail="Teacher not found")
        results = crud_export.by_teacher(db, teacher_id=id)
        headers = ["Practice ID", "Practice Name", "Subject", "Group", "Room", "Date", "Start Time", "End Time", "File Name"]
        filename_base = sanitize_filename(db_teacher.teacher_name)
        data_for_csv = [[p.practice_id, p.practice_name, p.subject_name, p.group_name, p.room_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]
    
    elif by == "room":
        db_room = crud_room.get_room_by_id(db, room_id=id)
        if not db_room: raise HTTPException(status_code=404, detail="Room not found")
        results = crud_export.by_room(db, room_id=id)
        headers = ["Teacher Name", "Teacher ID", "Practice ID", "Practice Name", "Subject", "Group", "Date", "Start Time", "End Time", "File Name"]
        filename_base = sanitize_filename(db_room.room_name)
        data_for_csv = [[p.teacher_name, p.teacher_id, p.practice_id, p.practice_name, p.subject_name, p.group_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]

    elif by == "subject":
        db_subject = crud_subject.get_subject_by_id(db, subject_id=id)
        if not db_subject: raise HTTPException(status_code=404, detail="Subject not found")
        results = crud_export.by_subject(db, subject_id=id)
        headers = ["Teacher Name", "Teacher ID", "Practice ID", "Practice Name", "Room", "Group", "Date", "Start Time", "End Time", "File Name"]
        filename_base = sanitize_filename(db_subject.subject_name)
        data_for_csv = [[p.teacher_name, p.teacher_id, p.practice_id, p.practice_name, p.room_name, p.group_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]

    elif by == "group":
        db_group = crud_group.get_group_by_id(db, group_id=id)
        if not db_group: raise HTTPException(status_code=404, detail="Group not found")
        results = crud_export.by_group(db, group_id=id)
        headers = ["Teacher Name", "Teacher ID", "Practice ID", "Practice Name", "Room", "Subject", "Date", "Start Time", "End Time", "File Name"]
        filename_base = sanitize_filename(db_group.group_name)
        data_for_csv = [[p.teacher_name, p.teacher_id, p.practice_id, p.practice_name, p.room_name, p.subject_name, p.practice_date, p.start_time, p.end_time, os.path.basename(p.file_url)] for p in results]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(data_for_csv)
    csv_content = output.getvalue()
    
    today_str = date.today().strftime("%Y%m%d")
    filename = f"{filename_base}_{today_str}.csv"
    
    try:
        email_service.send_export_email(
            recipients=request.recipients,
            csv_content=csv_content,
            filename=filename,
            export_title=request.export_title,
            lang=request.lang
        )
        return {"message": "Email sent successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")