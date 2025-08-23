from sqlalchemy.orm import Session
from src.models.room import Room

def seed_initial_data(db: Session) -> None:
    """
    Checks for and creates initial data if it doesn't exist.
    Currently, it seeds the computer lab rooms.
    """
    if db.query(Room).first() is None:
        print("No rooms found. Seeding initial room data...")
        
        initial_rooms = [
            Room(room_name="Room 1", capacity=20),
            Room(room_name="Room 2", capacity=25)
        ]
        
        db.add_all(initial_rooms)
        db.commit()
        
        print("Successfully seeded 2 rooms.")
    else:
        print("Rooms already exist. Skipping seeding.")