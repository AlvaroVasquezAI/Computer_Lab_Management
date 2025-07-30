from sqlalchemy.orm import Session
from src.models.subject import Subject

def get_subject_by_id(db: Session, subject_id: int) -> Subject | None:
    """
    Retrieves a single subject from the database by its ID.
    """
    return db.query(Subject).filter(Subject.subject_id == subject_id).first()


def get_subjects(db: Session):
    return db.query(Subject).order_by(Subject.subject_name).all()

def get_or_create_subject(db: Session, subject_name: str) -> Subject:
    db_subject = db.query(Subject).filter(Subject.subject_name == subject_name).first()
    if not db_subject:
        db_subject = Subject(subject_name=subject_name)
        db.add(db_subject)
    return db_subject