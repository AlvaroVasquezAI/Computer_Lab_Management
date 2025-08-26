from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.crud import crud_subject, crud_group, crud_data
from src.schemas import room as room_schema
from src.auth.security import get_current_teacher 
from src.models.teacher import Teacher 

router = APIRouter()

@router.get("/subjects")
def read_all_subjects(db: Session = Depends(get_db)):
    return crud_subject.get_subjects(db)

@router.get("/groups")
def read_all_groups(db: Session = Depends(get_db)):
    return crud_group.get_groups(db)

@router.get("/rooms", response_model=List[room_schema.Room])
def read_all_rooms(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher) 
):
    return crud_data.get_rooms(db)