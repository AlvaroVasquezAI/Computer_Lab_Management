from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src import crud, models, schemas
from src.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Teacher, status_code=status.HTTP_201_CREATED)
def create_teacher_endpoint(teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    """
    API endpoint to create a new teacher.
    - Checks if a teacher with the same name already exists.
    - If not, it calls the CRUD function to create the teacher.
    """
    db_teacher = crud.get_teacher_by_name(db, name=teacher.name)
    if db_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A teacher with the name '{teacher.name}' already exists."
        )
    return crud.create_teacher(db=db, teacher=teacher)


@router.get("/", response_model=List[schemas.Teacher])
def read_teachers_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    API endpoint to retrieve a list of all teachers.
    - Supports pagination with `skip` and `limit` query parameters.
    """
    teachers = crud.get_teachers(db, skip=skip, limit=limit)
    return teachers


@router.get("/{teacher_id}", response_model=schemas.Teacher)
def read_teacher_endpoint(teacher_id: int, db: Session = Depends(get_db)):
    """
    API endpoint to retrieve a single teacher by their ID.
    - If the teacher is not found, it returns a 404 error.
    """
    db_teacher = crud.get_teacher(db, teacher_id=teacher_id)
    if db_teacher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Teacher not found"
        )
    return db_teacher