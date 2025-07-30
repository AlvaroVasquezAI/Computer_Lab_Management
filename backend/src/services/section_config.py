# This list defines the order in which sections are checked and displayed.
SECTION_ORDER = [
    "title",
    "objective",
    "results",
    "justification",
    "development",
    "scope",
    "schedule",
    "materials",
    "conclusion",
    "bibliography",
    "risks",
]

SECTION_KEYWORDS = {
    # Using more specific, multi-word keywords for title reduces ambiguity.
    # ADDED "nombre de la practica" without accent for robustness.
    "title": {"nombre de la práctica", "nombre de la practica", "título", "practica #", "práctica #", "laboratorio #"},
    
    # These are good as they are.
    "results": {"resultados", "aprendizaje", "competencias", "propuestos"},
    "objective": {"objetivo", "objetivos"},
    "justification": {"introducción", "justificación"},
    "development": {"desarrollo de la práctica", "ejercicio"},
    "scope": {"alcance"},
    "schedule": {"cronograma", "presupuesto"},
    "materials": {"material", "equipo"},
    "conclusion": {"conclusión", "conclusiones"},
    "bibliography": {"bibliografía", "referencias"},
    "risks": {"riesgos", "seguridad"},
}

# This maps section keys to database columns AND UI display names.
DB_MAPPING = {
    "title": {"text_col": "practice_name_in_doc_text", "flag_col": "has_practice_name_in_doc", "is_required": True, "display_name": "Titulo de la práctica"},
    "objective": {"text_col": "objective_text", "flag_col": "has_objective", "is_required": True, "display_name": "Objetivo"},
    "results": {"text_col": "goals_text", "flag_col": "has_goals", "is_required": True, "display_name": "Resultados de aprendizaje"},
    "justification": {"text_col": "introduction_text", "flag_col": "has_introduction", "is_required": True, "display_name": "Introducción / Justificación"},
    "development": {"text_col": "development_text", "flag_col": "has_development", "is_required": True, "display_name": "Desarrollo / Procedimiento"},
    "scope": {"text_col": "scope_text", "flag_col": "has_scope", "is_required": False, "display_name": "Alcance"},
    "schedule": {"text_col": "schedule_text", "flag_col": "has_schedule", "is_required": False, "display_name": "Cronograma"},
    "materials": {"text_col": "materials_text", "flag_col": "has_materials", "is_required": False, "display_name": "Materiales"},
    "conclusion": {"text_col": "conclusion_text", "flag_col": "has_conclusion", "is_required": False, "display_name": "Conclusión"},
    "bibliography": {"text_col": "bibliography_text", "flag_col": "has_bibliography", "is_required": False, "display_name": "Bibliografía"},
    "risks": {"text_col": "risks_text", "flag_col": "has_risks", "is_required": False, "display_name": "Riesgos / Seguridad"},
}