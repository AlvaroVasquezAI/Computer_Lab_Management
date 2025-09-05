from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.services import context_builder
from typing import List, Dict, Any
from datetime import date

from langchain_community.llms.ollama import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from src.services import rag_indexer 
import subprocess 

router = APIRouter()

# --- Configuration ---
LLM_MODEL_NAME = "llama3.2"
OLLAMA_BASE_URL = "http://host.docker.internal:11434"

# --- Static School Context ---
SCHOOL_CONTEXT_EN = """
# INSTITUTIONAL INFORMATION
- Institution Name: Interdisciplinary Professional Unit in Engineering, Tlaxcala Campus (UPIIT) of the National Polytechnic Institute (IPN).
- Mission: To provide high-quality, innovative technological education to train professionals capable of contributing to the scientific and technological development of Mexico.
- Location: The UPIIT is a modern academic unit focused on internationalization.
- Core Values: Excellence, social commitment, and innovation.
- Offered Degrees: Engineering in Artificial Intelligence, Engineering in Transportation, Engineering in Automotive Systems, Biotechnological Engineering, Bachelor's in Data Science, Industrial Engineering.
- Creator of the "Ctrl + LAB" and the assistant "Controly": Álvaro García Vásquez, AI Engineer, LinkedIn: https://www.linkedin.com/in/alvarovasquezai/
- Director of UPIIT-IPN: Ing. Enrique Lima Morales
- Explanation of the name "Controly": It is a play on words between "Control" (from the keyboard shortcut Ctrl) and "Ly", which sounds like a friendly and modern name. The shortcut "Ctrl + y" represents the idea of moving forward and redoing, symbolizing progress and efficiency.
- Meaning of the name "Ctrl + LAB": It represents the keyboard shortcut "Ctrl" (Control) and "LAB" (Laboratory), symbolizing control and efficient management of the computer lab.
"""
SCHOOL_CONTEXT_ES = """
# INFORMACIÓN INSTITUCIONAL
- Nombre de la Institución:  Unidad Profesional Interdisciplinaria en Ingeniería Campus Tlaxcala (UPIIT) del Instituto Politécnico Nacional (IPN).
- Misión: Ofrecer educación tecnológica innovadora y de alta calidad para formar profesionales capaces de contribuir al desarrollo científico y tecnológico de México.
- Ubicación: La UPIIT es una unidad académica moderna con un enfoque en la internacionalización.
- Valores Fundamentales: Excelencia, compromiso social e innovación.
- Carrerras ofrecidas: Ingeniería en Inteligencia Artificial, Ingeniería en Transporte, Ingeniería en Sistemas Automotrices, Ingeniería Biotecnológica, Licenciatura en Ciencia de Datos, Ingeniería Industrial.
- Creador del sistema "Ctrl + LAB" y del asistente "Controly": Álvaro García Vásquez, Ingeniero en IA, LinkedIn: https://www.linkedin.com/in/alvarovasquezai/
- Director de la UPIIT-IPN: Ing. Enrique Lima Morales
- Explicación del nombre "Controly": Es un juego de palabras entre "Control" (por el atajo de teclado Ctrl) y "Ly", que suena como un nombre amigable y moderno. El atajo "Ctrl + y" representa la idea de avanzar y rehacer, simbolizando progreso y eficiencia.
- Significado del nombre "Ctrl + LAB": Representa el atajo de teclado "Ctrl" (Control) y "LAB" (Laboratorio), simbolizando el control y la gestión eficiente del laboratorio de cómputo.
"""

# --- Helper Function for Formatting History ---
def format_history(history: List[Dict[str, Any]]) -> str:
    if not history:
        return "No previous conversation history."
    formatted_lines = []
    for message in history:
        sender = "User" if message.get("sender") == "user" else "Assistant"
        text = message.get("text", "")
        formatted_lines.append(f"{sender}: {text}")
    return "\n".join(formatted_lines)

# --- LLM Chain Initialization ---
try:
    llm = Ollama(model=LLM_MODEL_NAME, base_url=OLLAMA_BASE_URL)

    template = """
# ROLE AND GOAL
You are Controly, so your name as the assistant is "Controly", ALWAYS REMEMBER, a cheerful and highly professional AI assistant for the "Ctrl + LAB" system, which is a system to manage the computer laboratory at UPIIT-IPN. Your sole purpose is to assist teachers by answering their questions accurately based on the information provided to you. The users you interact with are ALWAYS teachers; there are no students in this system.
Please, if the message is not the first one in the conversation, avoid repeating your introduction. If this is not the first message, don't say "Hello, [name]!" again. PLEASE.

# PERSONALITY
- Cheerful and encouraging: Use a positive and supportive tone.
- Academic and precise: Be clear, structured, and use professional language.
- Helpful: Proactively offer assistance and structure your answers clearly, using bullet points for lists.

# RULES
1.  **Strict Grounding:** You MUST base your answers exclusively on the information provided below. Do not use any external knowledge.
2.  **No Hallucination:** It is critical that you DO NOT invent information. If a detail is not present, it does not exist.
3.  **User Context is Key:** The user is a teacher. When they use personal words like "my" or "me", you MUST refer to the "USER CONTEXT" section to provide personalized answers.
4.  **Time Awareness:** Use the "CURRENT DATE" information to answer questions about "today", "tomorrow", "this week", etc.
5.  **Self-Correction:** Before concluding you cannot answer, mentally review the entire context at least twice.
6.  **Final Answer for Unknowns:** If after review you still cannot find the answer, politely state: "After carefully reviewing the provided information, I can't seem to find the specific details for your request. The context I have covers schedules and registered practices. How else may I assist you?"

# INPUT DATA

## CURRENT DATE
{current_date}

## Conversation History:
{history}

## Context Document (User and Lab Info):
{context}

## User's Latest Question:
{question}

# FINAL INSTRUCTIONS
Generate your answer in the same language as the user's question.

Answer:
"""
    prompt = ChatPromptTemplate.from_template(template)

    chain = (
        {
            "context": lambda x: x["context"],
            "question": lambda x: x["question"],
            "history": lambda x: format_history(x["history"]),
            "current_date": lambda x: x["current_date"]
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    print("Simplified RAG chain initialized successfully.")

except Exception as e:
    print(f"An unexpected error occurred during chain initialization: {e}")
    chain = None

# --- API Endpoint ---
class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []
    is_first_message: bool = False
    lang: str = 'en'

@router.post("/reindex", status_code=status.HTTP_200_OK, dependencies=[Depends(get_current_teacher)])
def trigger_ai_reindex():
    """
    Triggers the RAG indexing process for the AI assistant. (Any logged-in teacher)
    This is a long-running, blocking operation.
    """
    try:
        print("USER ACTION: AI Re-indexing triggered.")
        result_message = rag_indexer.build_and_save_index()
        print("USER ACTION: AI Re-indexing finished.")

        print("USER ACTION: Triggering server restart to load new index...")
        subprocess.run(["touch", "/app/src/main.py"])

        return {"message": result_message}
    except Exception as e:
        print(f"Error during AI re-indexing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during re-indexing: {str(e)}"
        )

@router.post("")
async def handle_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    if chain is None:
        raise HTTPException(status_code=503, detail="The chat service is not available.")
    try:
        teacher_context = context_builder.build_teacher_context_string(
            db=db, teacher_id=current_teacher.teacher_id, lang=request.lang
        )
        school_context = SCHOOL_CONTEXT_ES if request.lang == 'es' else SCHOOL_CONTEXT_EN
        full_context = f"{school_context}\n{teacher_context}"
        today = date.today()
        current_date_str = f"Today is {today.strftime('%A, %Y-%m-%d')}."

        llm_response = chain.invoke({
            "context": full_context,
            "question": request.message,
            "history": request.history,
            "current_date": current_date_str
        })
        
        return {"response": llm_response}
    
    except Exception as e:
        print(f"Error invoking personalized RAG chain with history: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your message.")