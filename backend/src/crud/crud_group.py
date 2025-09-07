from sqlalchemy.orm import Session
from src.models.group import Group

def get_groups(db: Session):
    return db.query(Group).order_by(Group.group_name).all()

def get_or_create_group(db: Session, group_name: str) -> Group:
    db_group = db.query(Group).filter(Group.group_name == group_name).first()
    if not db_group:
        db_group = Group(group_name=group_name)
        db.add(db_group)
    return db_group

def get_group_by_id(db: Session, group_id: int) -> Group | None:
    """Retrieves a single group by its ID."""
    return db.query(Group).filter(Group.group_id == group_id).first()