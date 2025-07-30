from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud import crud_subject, crud_group

router = APIRouter()

@router.get("/subjects")
def read_all_subjects(db: Session = Depends(get_db)):
    return crud_subject.get_subjects(db)

@router.get("/groups")
def read_all_groups(db: Session = Depends(get_db)):
    return crud_group.get_groups(db)