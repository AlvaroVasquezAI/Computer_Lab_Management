import os
from sqlalchemy.orm import Session, joinedload
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.documents import Document
from src.models import teacher, subject, group, room, schedule, practice, booking, announcement
from src.database import SessionLocal

# --- Configuration ---
VECTOR_STORE_PATH = "/app/vector_store"
EMBEDDING_MODEL_NAME = "nomic-embed-text" 
OLLAMA_BASE_URL = "http://host.docker.internal:11434"


def load_summary_document(db: Session) -> Document:
    """Creates a single summary document of all key entities."""
    teachers = db.query(teacher.Teacher).order_by(teacher.Teacher.teacher_name).all()
    subjects = db.query(subject.Subject).order_by(subject.Subject.subject_name).all()
    groups = db.query(group.Group).order_by(group.Group.group_name).all()

    teacher_names = ", ".join([t.teacher_name for t in teachers])
    subject_names = ", ".join([s.subject_name for s in subjects])
    group_names = ", ".join([g.group_name for g in groups])

    content = (
        f"System Summary:\n"
        f"This is a summary of the main entities in the computer lab management system.\n"
        f"List of all teachers in the system: {teacher_names}.\n"
        f"List of all subjects in the system: {subject_names}.\n"
        f"List of all groups in the system: {group_names}."
    )
    
    print("Loaded 1 summary document.")
    return Document(page_content=content, metadata={"source": "summary"})

def load_teachers(db: Session) -> list[Document]:
    """Loads teachers and formats them as documents."""
    teachers = db.query(teacher.Teacher).all()
    documents = []
    for t in teachers:
        content = (
            f"Teacher Profile:\n"
            f"Name: {t.teacher_name}\n"
            f"ID: {t.teacher_id}\n"
            f"Role: {t.role.value}\n"
            f"Email: {t.email}"
        )
        documents.append(Document(page_content=content, metadata={"source": "teachers", "id": t.teacher_id}))
    print(f"Loaded {len(documents)} teacher documents.")
    return documents

def load_rooms(db: Session) -> list[Document]:
    """Loads rooms and formats them as documents."""
    rooms = db.query(room.Room).all()
    documents = []
    for r in rooms:
        content = (
            f"Computer Lab Room:\n"
            f"Name: {r.room_name}\n"
            f"ID: {r.room_id}\n"
            f"Capacity: {r.capacity} people"
        )
        documents.append(Document(page_content=content, metadata={"source": "rooms", "id": r.room_id}))
    print(f"Loaded {len(documents)} room documents.")
    return documents

def load_schedules(db: Session) -> list[Document]:
    """Loads schedules with joins and formats them as documents."""
    day_map = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday"}
    schedules = db.query(schedule.Schedule).options(
        joinedload(schedule.Schedule.teacher),
        joinedload(schedule.Schedule.subject),
        joinedload(schedule.Schedule.group)
    ).all()
    
    documents = []
    for s in schedules:
        content = (
            f"Class Schedule Information:\n"
            f"Teacher: {s.teacher.teacher_name}\n"
            f"Subject: {s.subject.subject_name}\n"
            f"Group: {s.group.group_name}\n"
            f"Day: {day_map.get(s.day_of_week, 'Unknown Day')}\n"
            f"Time: from {s.start_time.strftime('%H:%M')} to {s.end_time.strftime('%H:%M')}"
        )
        documents.append(Document(page_content=content, metadata={"source": "schedules", "id": s.schedule_id}))
    print(f"Loaded {len(documents)} schedule documents.")
    return documents

def load_practices_and_bookings(db: Session) -> list[Document]:
    """Loads practices and their associated bookings into comprehensive documents."""
    practices = db.query(practice.Practice).options(
        joinedload(practice.Practice.teacher),
        joinedload(practice.Practice.subject),
        joinedload(practice.Practice.bookings).joinedload(booking.Booking.group),
        joinedload(practice.Practice.bookings).joinedload(booking.Booking.room)
    ).all()
    
    documents = []
    for p in practices:
        bookings_info = []
        if p.bookings:
            for b in sorted(p.bookings, key=lambda x: x.practice_date):
                bookings_info.append(
                    f"- Group '{b.group.group_name}' has a session in '{b.room.room_name}' on {b.practice_date.strftime('%Y-%m-%d')} "
                    f"from {b.start_time.strftime('%H:%M')} to {b.end_time.strftime('%H:%M')}."
                )
        
        booking_section = "Scheduled Bookings:\n" + "\n".join(bookings_info) if bookings_info else "This practice has no scheduled bookings."
        
        content = (
            f"Practice Document Information:\n"
            f"Title: {p.title}\n"
            f"ID: {p.practice_id}\n"
            f"Subject: {p.subject.subject_name}\n"
            f"Created by: {p.teacher.teacher_name}\n"
            f"Objective: {p.description}\n\n"
            f"{booking_section}"
        )
        documents.append(Document(page_content=content, metadata={"source": "practices", "id": p.practice_id}))
    print(f"Loaded {len(documents)} practice documents.")
    return documents

def load_announcements(db: Session) -> list[Document]:
    """Loads announcements and formats them."""
    announcements = db.query(announcement.Announcement).options(
        joinedload(announcement.Announcement.teacher),
        joinedload(announcement.Announcement.group),
        joinedload(announcement.Announcement.room)
    ).all()

    documents = []
    for a in announcements:
        target = "General"
        if a.group and a.room:
            target = f"for Group '{a.group.group_name}' in '{a.room.room_name}'"
        elif a.group:
            target = f"for Group '{a.group.group_name}'"
        elif a.room:
            target = f"for '{a.room.room_name}'"

        content = (
            f"Announcement:\n"
            f"Published by: {a.teacher.teacher_name} on {a.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            f"Target: {target}\n"
            f"Message: {a.description}"
        )
        documents.append(Document(page_content=content, metadata={"source": "announcements", "id": a.announcement_id}))
    print(f"Loaded {len(documents)} announcement documents.")
    return documents

def build_and_save_index():
    """Main function to orchestrate the RAG indexing process. Returns a success message."""
    print("Starting RAG indexing process...")
    
    db = SessionLocal()
    try:
        all_documents = []
        all_documents.append(load_summary_document(db)) 
        all_documents.extend(load_teachers(db))
        all_documents.extend(load_rooms(db))
        all_documents.extend(load_schedules(db))
        all_documents.extend(load_practices_and_bookings(db))
        all_documents.extend(load_announcements(db))
        
        if not all_documents:
            print("No documents found to index. Exiting.")
            return "No documents found to index." 

        print(f"Initializing embedding model '{EMBEDDING_MODEL_NAME}'...")
        embeddings = OllamaEmbeddings(
            model=EMBEDDING_MODEL_NAME,
            base_url=OLLAMA_BASE_URL
        )
        
        print(f"Building FAISS vector store with {len(all_documents)} documents...")
        vector_store = FAISS.from_documents(all_documents, embeddings)
        
        if not os.path.exists(VECTOR_STORE_PATH):
            os.makedirs(VECTOR_STORE_PATH)
            
        print(f"Saving vector store to '{VECTOR_STORE_PATH}'...")
        vector_store.save_local(VECTOR_STORE_PATH)
        
        print("RAG indexing process completed successfully!")
        return f"RAG indexing process completed successfully! Indexed {len(all_documents)} documents."
        
    finally:
        db.close()

if __name__ == "__main__":
    build_and_save_index()