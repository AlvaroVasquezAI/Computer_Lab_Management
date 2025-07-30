from sqlalchemy.orm import Session
from src.models.teacher import Teacher
from src.schemas.teacher import TeacherCreate
from src.auth.security import get_password_hash

def get_teacher_by_email(db: Session, email: str) -> Teacher | None:
    """
    Retrieves a single teacher from the database by their email.
    """
    return db.query(Teacher).filter(Teacher.email == email).first()

def create_teacher(db: Session, teacher: TeacherCreate) -> Teacher:
    """
    Creates a new teacher object and adds it to the session.
    DOES NOT COMMIT. This allows it to be part of a larger transaction.
    """
    hashed_password = get_password_hash(teacher.password)
    db_teacher = Teacher(
        teacher_name=teacher.teacher_name,
        email=teacher.email,
        password_hash=hashed_password
    )
    db.add(db_teacher)
    return db_teacher

def get_teacher_by_id(db: Session, teacher_id: int) -> Teacher | None:
    """
    Retrieves a single teacher from the database by its ID.
    """
    return db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()

def get_teachers(db: Session, skip: int = 0, limit: int = 100):
    """
    Retrieves a list of all teachers from the database.
    """
    return db.query(Teacher).offset(skip).limit(limit).all()

def update_teacher_password(db: Session, teacher: Teacher, new_password: str) -> Teacher:
    """
    Updates a teacher's password with a new hashed password.
    """
    teacher.password_hash = get_password_hash(new_password)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher