from sqlalchemy.orm import Session
from sqlalchemy import func
from src.crud import crud_workspace, crud_dashboard, crud_chat
from src.models.teacher import Teacher 

def get_teacher_name(db: Session, teacher_id: int):
    """Retrieves the full name of the currently logged-in teacher."""
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    return teacher.teacher_name if teacher else "Unknown Teacher"

def get_all_subjects_for_teacher(db: Session, teacher_id: int):
    """Retrieves a list of all subjects the teacher is associated with."""
    subjects = crud_workspace.get_subjects_by_teacher(db=db, teacher_id=teacher_id)
    if not subjects:
        return "The teacher is not associated with any subjects."
    return ", ".join([subject.subject_name for subject in subjects])

def count_all_practices_for_teacher(db: Session, teacher_id: int):
    """Counts the total number of practices the teacher has created."""
    practices = crud_workspace.get_practices_for_teacher(db, teacher_id)
    return f"The teacher has created a total of {len(practices)} practices."

def general_profile_query(db: Session, teacher_id: int):
    """
    Retrieves a comprehensive summary of the teacher's profile.
    Useful for general questions like 'what do you know about me?' or 'tell me about my profile'.
    """
    return crud_chat.get_full_teacher_profile(db=db, teacher_id=teacher_id)

TOOLS = {
    "general_profile_query": {
        "function": general_profile_query,
        "description": "Useful for general questions about the user's profile, such as 'what do you know about me?' or 'tell me my details'.",
        "parameters": []
    },
    "get_teacher_name": {
        "function": get_teacher_name,
        "description": "Useful for when the user asks for their own name.",
        "parameters": []
    },
    "get_all_subjects_for_teacher": {
        "function": get_all_subjects_for_teacher,
        "description": "Useful for listing all the subjects a teacher is associated with. Good for questions like 'what are my subjects?' or 'list my classes'.",
        "parameters": [] 
    },
    "count_all_practices_for_teacher": {
        "function": count_all_practices_for_teacher,
        "description": "Useful for counting the total number of practices created by the user.",
        "parameters": []
    },
    "get_schedule_for_subject": {
        "function": crud_chat.get_schedule_for_subject_by_teacher,
        "description": "Useful for finding the weekly class schedule for a specific subject. Requires the subject's name.",
        "parameters": [{"name": "subject_name", "type": "string", "description": "The name of the subject, e.g., 'Big Data'."}]
    },
    "get_practice_status_counts": {
        "function": crud_chat.get_practice_status_counts,
        "description": "Useful for counting how many practices have passed and how many are in the future.",
        "parameters": []
    },
    "count_practices_for_subject": {
        "function": crud_workspace.count_practices_for_subject,
        "description": "Useful for counting practices for one specific subject. Requires the subject's name.",
        "parameters": [{"name": "subject_name", "type": "string", "description": "The name of the subject, e.g., 'Machine Learning'."}]
    }
}