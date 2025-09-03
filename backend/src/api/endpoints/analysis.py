import fitz  
import ollama
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form
from src.auth.security import get_current_teacher
import json
import re

router = APIRouter()

PROMPT_ANALYZE_CHUNK = {
    'es': {
        "system": "Eres un asistente académico experto. Tu tarea es analizar un texto de una práctica de laboratorio. Primero, resume el texto de forma concisa en español. Segundo, proporciona una frase de retroalimentación constructiva en español. Responde ÚNICAMENTE con un objeto JSON válido con dos claves: 'summary' y 'feedback'.",
        "user": "Analiza este texto de la sección '{section_name}':\n\n{text}"
    },
    'en': {
        "system": "You are an expert academic assistant. Your task is to analyze a section from a lab practice document. First, summarize the text concisely in English. Second, provide one sentence of constructive feedback in English. Respond ONLY with a valid JSON object with two keys: 'summary' and 'feedback'.",
        "user": "Analyze this text from the '{section_name}' section:\n\n{text}"
    }
}

SECTION_KEYWORDS = {
    "nombre_practica": ["nombre de la práctica", "título de la práctica", "practica no.", "tema"],
    "resultados_aprendizaje": ["resultados de aprendizaje propuestos", "resultados de aprendizaje", "resultados propuestos", "competencias", "rap's"],
    "objetivo": ["objetivo", "objetivos", "meta de la práctica", "propósito"],
    "introduccion": ["introducción", "justificación", "marco teórico", "fundamento teórico", "antecedentes"],
    "desarrollo": ["desarrollo de la práctica", "procedimiento", "metodología", "pasos a seguir", "ejercicios", "actividades"],
    "conclusion": ["conclusión", "conclusiones", "reflexión final", "resultados y discusión"]
}
REQUIRED_KEYS = ["nombre_practica", "resultados_aprendizaje", "objetivo", "introduccion", "desarrollo", "conclusion"]
KEY_TO_SPANISH_MAP = dict(zip(REQUIRED_KEYS, ["Nombre de la práctica", "Resultados de aprendizaje propuestos", "Objetivo", "Introducción", "Desarrollo de la práctica", "Conclusión"]))
KEY_TO_ENGLISH_MAP = dict(zip(REQUIRED_KEYS, ["Practice Name", "Proposed Learning Outcomes", "Objective", "Introduction", "Practice Development", "Conclusion"]))

def extract_sections_with_python(full_text: str) -> dict:
    sections = {}
    lines = full_text.split('\n')
    
    # Regex to identify a line that is likely a section header (Roman or Arabic numerals)
    header_pattern = re.compile(r"^\s*(?:\d+|[IVX]+)\.\s*", re.IGNORECASE)
    
    found_headers = []
    for i, line in enumerate(lines):
        if header_pattern.match(line):
            line_lower = line.lower()
            for key, keywords in SECTION_KEYWORDS.items():
                if any(keyword in line_lower for keyword in keywords):
                    found_headers.append({'key': key, 'line_index': i})
                    break
    
    if not found_headers:
        return {}

    for i, header in enumerate(found_headers):
        start_index = header['line_index']
        end_index = found_headers[i + 1]['line_index'] if i + 1 < len(found_headers) else len(lines)
        
        section_lines = lines[start_index:end_index]

        first_line_content = re.sub(header_pattern, '', section_lines[0], 1).strip()

        if first_line_content.startswith(':'):
            first_line_content = first_line_content[1:].strip()

        full_section_text = [first_line_content] + section_lines[1:]
        
        sections[header['key']] = "\n".join(line.strip() for line in full_section_text if line.strip()).strip()

    return sections


@router.post("/analyze-pdf", dependencies=[Depends(get_current_teacher)])
async def analyze_practice_document(file: UploadFile = File(...), lang: str = Form("en")):
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Invalid file type.")

    try:
        analyze_chunk_prompts = PROMPT_ANALYZE_CHUNK.get(lang, PROMPT_ANALYZE_CHUNK['en'])
        
        file_bytes = await file.read()
        full_text = ""
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                full_text += page.get_text()

        if len(full_text.strip()) < 50:
            raise HTTPException(status_code=422, detail="PDF contains too little text.")

        extracted_sections = extract_sections_with_python(full_text)
        
        name_map = KEY_TO_SPANISH_MAP if lang == 'es' else KEY_TO_ENGLISH_MAP
        found_sections_result = {}
        missing_required_sections = []

        for key, display_name in name_map.items():
            if key in extracted_sections and extracted_sections[key]:
                original_text = extracted_sections[key]
                if key == "nombre_practica":
                    found_sections_result[display_name] = {"text": original_text, "feedback": "" if lang == 'es' else ""}
                else:
                    analyze_response = ollama.chat(model='llama3.2', messages=[{'role': 'system', 'content': analyze_chunk_prompts["system"]}, {'role': 'user', 'content': analyze_chunk_prompts["user"].format(section_name=display_name, text=original_text)}], format='json')
                    llm_output = json.loads(analyze_response['message']['content'])
                    found_sections_result[display_name] = {"text": llm_output.get("summary", original_text), "feedback": llm_output.get("feedback", "No feedback provided.")}
            else:
                missing_required_sections.append(display_name)
        
        final_payload = {"stats": {"found": len(found_sections_result), "total_required": len(REQUIRED_KEYS)}, "analysis": {"found_sections": found_sections_result, "missing_required_sections": missing_required_sections}}
        return final_payload

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="The LLM returned a malformed response.")
    except Exception as e:
        print(f"Ollama or PDF processing error: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during analysis: {e}")