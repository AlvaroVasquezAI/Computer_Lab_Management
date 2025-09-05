from sqlalchemy.orm import Session, joinedload
from collections import defaultdict
from src.models import teacher, subject, group, room, schedule, practice, booking

# --- Translation Dictionaries ---
TRANSLATIONS = {
    'en': {
        'room_header': "ROOM {room_name}",
        'room_id': "ID",
        'room_name': "Name",
        'room_capacity': "Capacity",
        'people': "people",
        'profile_header': "Profile Info for {teacher_name}",
        'profile_id': "ID",
        'profile_email': "Email",
        'profile_name': "Name",
        'profile_role': "Role",
        'weekly_schedule_header': "Weekly Schedule",
        'day_monday': "Monday",
        'day_tuesday': "Tuesday",
        'day_wednesday': "Wednesday",
        'day_thursday': "Thursday",
        'day_friday': "Friday",
        'no_classes': "No classes scheduled.",
        'schedule_entry': "{group_name}: from {start_time} to {end_time} with {subject_name}",
        'subjects_header': "Teacher's Subjects",
        'subject_entry': "{group_name}: {day_name}, from {start_time} to {end_time}",
        'groups_header': "Teacher's Groups",
        'group_entry': "{subject_name}: {day_name}, from {start_time} to {end_time}",
        'practices_header': "Teacher's Practices Registered",
        'no_practices': "No practices registered.",
        'practice_title': "Practice",
        'practice_subject': "Subject",
        'practice_sessions': "Sessions",
        'session_entry': "Group: {group_name}, Room: {room_name}, Date: {date} {start_time}-{end_time}",
        'main_header': "This document contains all available information for the current user and the lab.",
        'user_context_header': "===== USER CONTEXT =====",
        'lab_context_header': "===== GENERAL LAB CONTEXT =====",
        'teacher_list_header': "LIST OF ALL TEACHERS IN THE SYSTEM", 
        'teacher_list_entry': "- Name: {name}, ID: {id}, Email: {email}" 
    },
    'es': {
        'room_header': "SALA {room_name}",
        'room_id': "ID",
        'room_name': "Nombre",
        'room_capacity': "Capacidad",
        'people': "personas",
        'profile_header': "Información de Perfil para {teacher_name}",
        'profile_id': "ID",
        'profile_email': "Correo electrónico",
        'profile_name': "Nombre",
        'profile_role': "Rol",
        'weekly_schedule_header': "Horario Semanal",
        'day_monday': "Lunes",
        'day_tuesday': "Martes",
        'day_wednesday': "Miércoles",
        'day_thursday': "Jueves",
        'day_friday': "Viernes",
        'no_classes': "No hay clases programadas.",
        'schedule_entry': "{group_name}: de {start_time} a {end_time} con {subject_name}",
        'subjects_header': "Materias del Profesor",
        'subject_entry': "{group_name}: {day_name}, de {start_time} a {end_time}",
        'groups_header': "Grupos del Profesor",
        'group_entry': "{subject_name}: {day_name}, de {start_time} a {end_time}",
        'practices_header': "Prácticas Registradas del Profesor",
        'no_practices': "No hay prácticas registradas.",
        'practice_title': "Práctica",
        'practice_subject': "Materia",
        'practice_sessions': "Sesiones",
        'session_entry': "Grupo: {group_name}, Sala: {room_name}, Fecha: {date} {start_time}-{end_time}",
        'main_header': "Este documento contiene toda la información disponible para el usuario actual y el laboratorio.",
        'user_context_header': "===== CONTEXTO DEL USUARIO =====",
        'lab_context_header': "===== CONTEXTO GENERAL DEL LABORATORIO =====",
        'teacher_list_header': "LISTA DE TODOS LOS PROFESORES DEL SISTEMA", 
        'teacher_list_entry': "- Nombre: {name}, ID: {id}, Correo: {email}"            
    }
}

def build_lab_context_string(db: Session, lang: str = 'en') -> str:
    """Builds a string containing general information about the lab rooms AND all teachers."""
    t = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    
    # --- 1. Get Room Information ---
    lab_rooms = db.query(room.Room).order_by(room.Room.room_name).all()
    room_sections = []
    for r in lab_rooms:
        room_info = (
            f"{t['room_header'].format(room_name=r.room_name.upper())}:\n"
            f"- {t['room_id']}: {r.room_id}\n"
            f"- {t['room_name']}: {r.room_name}\n"
            f"- {t['room_capacity']}: {r.capacity} {t['people']}"
        )
        room_sections.append(room_info)
    all_rooms_info = "\n\n".join(room_sections)

    # --- 2. Get All Teachers Information ---
    all_teachers = db.query(teacher.Teacher).order_by(teacher.Teacher.teacher_name).all()
    teacher_lines = [f"{t['teacher_list_header']}:"]
    for teach in all_teachers:
        teacher_lines.append(
            t['teacher_list_entry'].format(name=teach.teacher_name, id=teach.teacher_id, email=teach.email)
        )
    all_teachers_info = "\n".join(teacher_lines)
        
    # --- 3. Combine them ---
    return f"{all_rooms_info}\n\n{all_teachers_info}"

def build_teacher_context_string(db: Session, teacher_id: int, lang: str = 'en') -> str:
    """
    Builds a comprehensive, structured string of all information related to a single teacher.
    """
    t = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    db_teacher = db.query(teacher.Teacher).filter(teacher.Teacher.teacher_id == teacher_id).first()
    if not db_teacher:
        return "No teacher found for the given ID."

    # 1. Profile Info
    profile_info = (
        f"{t['profile_header'].format(teacher_name=db_teacher.teacher_name)}:\n"
        f"- {t['profile_id']}: {db_teacher.teacher_id}\n"
        f"- {t['profile_email']}: {db_teacher.email}\n"
        f"- {t['profile_name']}: {db_teacher.teacher_name}\n"
        f"- {t['profile_role']}: {db_teacher.role.value}"
    )

    # 2. Weekly Schedule
    day_map_keys = {1: "day_monday", 2: "day_tuesday", 3: "day_wednesday", 4: "day_thursday", 5: "day_friday"}
    teacher_schedules = db.query(schedule.Schedule).options(
        joinedload(schedule.Schedule.subject),
        joinedload(schedule.Schedule.group)
    ).filter(schedule.Schedule.teacher_id == teacher_id).order_by(
        schedule.Schedule.day_of_week, schedule.Schedule.start_time
    ).all()
    
    weekly_schedule_by_day = defaultdict(list)
    for s in teacher_schedules:
        entry = f"--- " + t['schedule_entry'].format(
            group_name=s.group.group_name,
            start_time=s.start_time.strftime('%H:%M'),
            end_time=s.end_time.strftime('%H:%M'),
            subject_name=s.subject.subject_name
        )
        weekly_schedule_by_day[t[day_map_keys[s.day_of_week]]].append(entry)

    weekly_schedule_lines = [f"{t['weekly_schedule_header']}:"]
    for day_key in day_map_keys.values():
        day_name = t[day_key]
        weekly_schedule_lines.append(f"- {day_name}:")
        if weekly_schedule_by_day[day_name]:
            weekly_schedule_lines.extend(weekly_schedule_by_day[day_name])
        else:
            weekly_schedule_lines.append(f"--- {t['no_classes']}")
    weekly_schedule_info = "\n".join(weekly_schedule_lines)
    
    # 3. Teacher's Subjects
    subjects_by_name = defaultdict(list)
    for s in teacher_schedules:
        entry = f"--- " + t['subject_entry'].format(
            group_name=s.group.group_name,
            day_name=t[day_map_keys[s.day_of_week]],
            start_time=s.start_time.strftime('%H:%M'),
            end_time=s.end_time.strftime('%H:%M')
        )
        subjects_by_name[s.subject.subject_name].append(entry)

    subjects_lines = [f"{t['subjects_header']}:"]
    for subject_name, entries in sorted(subjects_by_name.items()):
        subjects_lines.append(f"- {subject_name}:")
        subjects_lines.extend(entries)
    subjects_info = "\n".join(subjects_lines)

    # 4. Teacher's Groups
    groups_by_name = defaultdict(list)
    for s in teacher_schedules:
        entry = f"--- " + t['group_entry'].format(
            subject_name=s.subject.subject_name,
            day_name=t[day_map_keys[s.day_of_week]],
            start_time=s.start_time.strftime('%H:%M'),
            end_time=s.end_time.strftime('%H:%M')
        )
        groups_by_name[s.group.group_name].append(entry)
    
    groups_lines = [f"{t['groups_header']}:"]
    for group_name, entries in sorted(groups_by_name.items()):
        groups_lines.append(f"- {group_name}:")
        groups_lines.extend(entries)
    groups_info = "\n".join(groups_lines)

    # 5. Teacher's Practices
    teacher_practices = db.query(practice.Practice).options(
        joinedload(practice.Practice.subject),
        joinedload(practice.Practice.bookings).joinedload(booking.Booking.group),
        joinedload(practice.Practice.bookings).joinedload(booking.Booking.room)
    ).filter(practice.Practice.teacher_id == teacher_id).order_by(practice.Practice.title).all()

    practices_lines = [f"{t['practices_header']}:"]
    if not teacher_practices:
        practices_lines.append(f"- {t['no_practices']}")
    else:
        for p in teacher_practices:
            practices_lines.append(f"- {t['practice_title']}: {p.title}")
            practices_lines.append(f"-- {t['practice_subject']}: {p.subject.subject_name}")
            practices_lines.append(f"-- {t['practice_sessions']}:")
            if p.bookings:
                for b in sorted(p.bookings, key=lambda x: (x.practice_date, x.start_time)):
                    practices_lines.append(f"--- " + t['session_entry'].format(
                        group_name=b.group.group_name,
                        room_name=b.room.room_name,
                        date=b.practice_date.strftime('%Y-%m-%d'),
                        start_time=b.start_time.strftime('%H:%M'),
                        end_time=b.end_time.strftime('%H:%M')
                    ))
            else:
                practices_lines.append("--- No sessions booked for this practice.")
    practices_info = "\n".join(practices_lines)

    # Assemble the final document
    final_context = (
        f"{t['main_header']}\n\n"
        f"{t['user_context_header']}\n\n"
        f"{profile_info}\n\n"
        f"{weekly_schedule_info}\n\n"
        f"{subjects_info}\n\n"
        f"{groups_info}\n\n"
        f"{practices_info}\n\n"
        f"{t['lab_context_header']}\n\n"
        f"{build_lab_context_string(db, lang)}"
    )
    
    return final_context