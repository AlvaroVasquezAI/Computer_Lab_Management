import os
from sqlalchemy.orm import Session, joinedload
from langchain_community.vectorstores import FAISS
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_core.documents import Document
from src.models import teacher, subject, group, room, announcement
from src.database import SessionLocal

# --- Configuration ---
VECTOR_STORE_PATH = "/app/vector_store"
EMBEDDING_MODEL_NAME = "nomic-embed-text" 
OLLAMA_BASE_URL = "http://host.docker.internal:11434"

def load_summary_document(db: Session) -> Document:
    """
    Creates a single, high-level summary document of the system's entities.
    This helps with general questions about the system's scope.
    """
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
        f"List of all subjects registered in the system: {subject_names}.\n"
        f"List of all groups registered in the system: {group_names}."
    )
    
    print("Loaded 1 summary document.")
    return Document(page_content=content, metadata={"source": "summary"})

def load_teachers_directory(db: Session) -> list[Document]:
    """
    Loads a general directory of all teachers in the system.
    This is for answering questions like "Who is in the system?" or "What is Jane Doe's email?".
    It does NOT include their specific schedules or practices.
    """
    teachers_list = db.query(teacher.Teacher).all()
    documents = []
    for t in teachers_list:
        content = (
            f"Teacher Directory Entry:\n"
            f"Name: {t.teacher_name}\n"
            f"ID: {t.teacher_id}\n"
            f"Role: {t.role.value}\n"
            f"Email: {t.email}"
        )
        documents.append(Document(page_content=content, metadata={"source": "teachers_directory", "teacher_id": t.teacher_id}))
    print(f"Loaded {len(documents)} teacher directory documents.")
    return documents

def load_rooms(db: Session) -> list[Document]:
    """
    Loads general information about each computer lab room.
    """
    rooms_list = db.query(room.Room).all()
    documents = []
    for r in rooms_list:
        content = (
            f"Computer Lab Room Information:\n"
            f"Name: {r.room_name}\n"
            f"ID: {r.room_id}\n"
            f"Capacity: {r.capacity} people"
        )
        documents.append(Document(page_content=content, metadata={"source": "rooms", "id": r.room_id}))
    print(f"Loaded {len(documents)} room documents.")
    return documents

def load_announcements(db: Session) -> list[Document]:
    """
    Loads all announcements. These are general and useful for all users to know about.
    """
    announcements_list = db.query(announcement.Announcement).options(
        joinedload(announcement.Announcement.teacher),
        joinedload(announcement.Announcement.group),
        joinedload(announcement.Announcement.room)
    ).all()

    documents = []
    for a in announcements_list:
        target = "General Audience"
        if a.group and a.room:
            target = f"for Group '{a.group.group_name}' in Room '{a.room.room_name}'"
        elif a.group:
            target = f"for Group '{a.group.group_name}'"
        elif a.room:
            target = f"for Room '{a.room.room_name}'"

        content = (
            f"System Announcement:\n"
            f"Published by: {a.teacher.teacher_name} on {a.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            f"Audience: {target}\n"
            f"Message: {a.description}"
        )
        documents.append(Document(page_content=content, metadata={"source": "announcements", "id": a.announcement_id, "teacher_id": a.teacher_id}))
    print(f"Loaded {len(documents)} announcement documents.")
    return documents

def build_and_save_index():
    """
    Main function to orchestrate the RAG indexing process.
    This now only indexes GENERAL, system-wide information.
    All detailed, user-specific data is handled in real-time by context_builder.py.
    """
    print("Starting RAG indexing process for GENERAL knowledge base...")
    
    db = SessionLocal()
    try:
        all_documents = []
        all_documents.append(load_summary_document(db)) 
        all_documents.extend(load_teachers_directory(db))
        all_documents.extend(load_rooms(db))
        all_documents.extend(load_announcements(db))
        
        if not all_documents:
            print("No documents found to index. Exiting.")
            return "No documents found to index." 

        print(f"Initializing embedding model '{EMBEDDING_MODEL_NAME}'...")
        embeddings = OllamaEmbeddings(
            model=EMBEDDING_MODEL_NAME,
            base_url=OLLAMA_BASE_URL
        )
        
        print(f"Building FAISS vector store with {len(all_documents)} general documents...")
        vector_store = FAISS.from_documents(all_documents, embeddings)
        
        if not os.path.exists(VECTOR_STORE_PATH):
            os.makedirs(VECTOR_STORE_PATH)
            
        print(f"Saving vector store to '{VECTOR_STORE_PATH}'...")
        vector_store.save_local(VECTOR_STORE_PATH)
        
        print("RAG indexing process completed successfully!")
        return f"RAG indexing process completed successfully! Indexed {len(all_documents)} general documents."
        
    finally:
        db.close()

if __name__ == "__main__":
    build_and_save_index()