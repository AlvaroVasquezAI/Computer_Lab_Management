from http.client import HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.crud import crud_workspace
from src.schemas import subject as subject_schema, group as group_schema, workspace as workspace_schema

router = APIRouter()

@router.get("/subjects", response_model=List[subject_schema.Subject])
def get_teacher_subjects(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all subjects for the currently logged-in teacher.
    """
    return crud_workspace.get_subjects_by_teacher(db, teacher_id=current_teacher.teacher_id)

@router.get("/groups", response_model=List[group_schema.Group])
def get_teacher_groups(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all unique groups for the currently logged-in teacher.
    """
    return crud_workspace.get_groups_by_teacher(db, teacher_id=current_teacher.teacher_id)

@router.get("/stats/practices-per-subject", response_model=List[workspace_schema.PracticeStats])
def get_teacher_practice_stats(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get the count of practices per subject for the logged-in teacher.
    """
    return crud_workspace.get_practice_stats_by_teacher(db, teacher_id=current_teacher.teacher_id)

@router.get("/subjects/{subject_id}", response_model=workspace_schema.SubjectDetail)
def get_subject_details(
    subject_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get detailed information for a specific subject taught by the logged-in teacher.
    """
    details = crud_workspace.get_subject_details_for_teacher(
        db, teacher_id=current_teacher.teacher_id, subject_id=subject_id
    )
    if not details:
        raise HTTPException(status_code=404, detail="Subject not found or not taught by this teacher.")
    return details

@router.get("/groups/{group_id}", response_model=workspace_schema.GroupDetailWithSubjects)
def get_group_details(
    group_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get detailed information for a specific group taught by the logged-in teacher.
    """
    details = crud_workspace.get_group_details_for_teacher(
        db, teacher_id=current_teacher.teacher_id, group_id=group_id
    )
    if not details:
        raise HTTPException(status_code=404, detail="Group not found or not taught by this teacher.")
    return details
    