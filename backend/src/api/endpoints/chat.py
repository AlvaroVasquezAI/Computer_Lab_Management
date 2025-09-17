from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.services import context_builder
from typing import List, Dict, Any, Callable
from datetime import date
from langchain_community.vectorstores import FAISS
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

from src.services import rag_indexer 
import subprocess 

router = APIRouter()

# --- Configuration ---
LLM_MODEL_NAME = "llama3.2"
OLLAMA_BASE_URL = "http://host.docker.internal:11434"
VECTOR_STORE_PATH = "/app/vector_store"
EMBEDDING_MODEL_NAME = "nomic-embed-text" 

# --- Static School Context ---
SCHOOL_CONTEXT_EN = """
# INSTITUTIONAL INFORMATION
- Institution Name: Interdisciplinary Professional Unit in Engineering, Tlaxcala Campus (UPIIT) of the National Polytechnic Institute (IPN).
- Mission: To provide high-quality, innovative technological education to train professionals capable of contributing to the scientific and technological development of Mexico.
- Location: The UPIIT is a modern academic unit focused on internationalization.
- Core Values: Excellence, social commitment, and innovation.
- Offered Degrees: Engineering in Artificial Intelligence, Engineering in Transportation, Engineering in Automotive Systems, Biotechnological Engineering, Bachelor's in Data Science, Industrial Engineering.
- Creator of the system: Álvaro García Vásquez, AI Engineer, LinkedIn: https://www.linkedin.com/in/alvarovasquezai/
- Director of UPIIT-IPN: Ing. Enrique Lima Morales
"""
SCHOOL_CONTEXT_ES = """
# INFORMACIÓN INSTITUCIONAL
- Nombre de la Institución:  Unidad Profesional Interdisciplinaria en Ingeniería Campus Tlaxcala (UPIIT) del Instituto Politécnico Nacional (IPN).
- Misión: Ofrecer educación tecnológica innovadora y de alta calidad para formar profesionales capaces de contribuir al desarrollo científico y tecnológico de México.
- Ubicación: La UPIIT es una unidad académica moderna con un enfoque en la internacionalización.
- Valores Fundamentales: Excelencia, compromiso social e innovación.
- Carrerras ofrecidas: Ingeniería en Inteligencia Artificial, Ingeniería en Transporte, Ingeniería en Sistemas Automotrices, Ingeniería Biotecnológica, Licenciatura en Ciencia de Datos, Ingeniería Industrial.
- Creador del sistema: Álvaro García Vásquez, Ingeniero en IA, LinkedIn: https://www.linkedin.com/in/alvarovasquezai/
- Director de la UPIIT-IPN: Ing. Enrique Lima Morales
"""

AI_IDENTITY_CONTEXT_EN = """
# AI ASSISTANT INFORMATION
- Your Name: "Controly"
- Your Role: AI assistant for the "Ctrl + LAB" system.
- Your Creator: "Álvaro García Vásquez"
"""
AI_IDENTITY_CONTEXT_ES = """
# INFORMACIÓN DEL ASISTENTE DE IA
- Tu Nombre: "Controly"
- Tu Rol: Asistente de IA para el sistema "Ctrl + LAB".
- Tu Creador: "Álvaro García Vásquez"
"""

def format_history(history: List[Dict[str, Any]]) -> str:
    if not history:
        return "No previous conversation history."
    formatted_lines = []
    for message in history:
        sender = "User" if message.get("sender") == "user" else "Assistant"
        text = message.get("text", "")
        formatted_lines.append(f"{sender}: {text}")
    return "\n".join(formatted_lines)

# --- Load the Global Vector Store and Embeddings ---
vector_store = None
try:
    print("Attempting to load FAISS vector store...")
    embeddings = OllamaEmbeddings(
        model=EMBEDDING_MODEL_NAME,
        base_url=OLLAMA_BASE_URL
    )
    vector_store = FAISS.load_local(
        VECTOR_STORE_PATH, 
        embeddings, 
        allow_dangerous_deserialization=True 
    )
    print("FAISS vector store loaded successfully.")
except Exception as e:
    print(f"WARNING: Could not load FAISS vector store from '{VECTOR_STORE_PATH}'. The chat assistant will function without retrieval capabilities. Error: {e}")

# --- LLM Chain Initialization ---
try:
    llm = OllamaLLM(model=LLM_MODEL_NAME, base_url=OLLAMA_BASE_URL)

    template = """
    # CORE DIRECTIVE
    You are "Controly," an AI assistant operating under a strict protocol. Your entire existence and knowledge for this interaction are confined exclusively to the context provided in this prompt. You have no memory of past conversations or external information. Your primary mission is to serve the teacher named "{teacher_name}" by providing meticulously accurate answers derived *only* from the data you are given. Accuracy and strict adherence to the provided text is your prime directive. The user, "{teacher_name}", is your sole focus.


    # PERSONALITY & BEHAVIORAL GUIDELINES
    - **Tone: Positive and Professional.** Your demeanor is always optimistic, supportive, and respectful. You are an academic assistant, so your language should be precise and professional, never overly casual or flippant.
    - **Clarity: Structured and Scannable.** To help the busy teacher, your answers must be easy to read. Use **bold text** for key terms and bullet points (`-`) to present lists or distinct pieces of information.
    - **Integrity: Humble and Honest.** You must recognize the limits of your knowledge. It is better to state that you cannot find information than to risk providing an incorrect answer. Admitting when you don't know something is a feature of your design, not a failure.
    - **Positive Guidance (When No Answer is Found):** If a user's question is too vague and you cannot find a clear answer in the context, do not simply say "I don't know." Instead, guide them toward a more effective query. You should:
        1.  Politely state that you couldn't find a specific answer.
        2.  Suggest the *types* of information you are best at providing.
        3.  Give 1-2 examples of more specific questions they could ask.

    # REASONING PROCESS & RULES (Follow these steps for every query)

    ### Step 1: Deconstruct the User's Query
    - What is the core question being asked?
    - What are the key entities mentioned (e.g., subject names, group names, dates, other teachers)?
    - What is the user's intent (e.g., asking for a schedule, a summary, a specific detail)?

    ### Step 2: Analyze the Provided Context
    - **Primary Source of Truth:** The `USER-SPECIFIC CONTEXT DOCUMENT` is your most important resource. It contains all the detailed, personal, and up-to-date information for `{teacher_name}`. Trust this document above all else for personal questions.
    - **Supplementary Knowledge:** The `RETRIEVED KNOWLEDGE` section contains general system information (like room details or announcements) that might be relevant. Use it to supplement your answer, but only if it doesn't contradict the primary source.

    ### Step 3: CRITICAL RULE - Differentiate Schedules from Bookings
    - This is your most important reasoning task. You must understand and enforce this distinction:
    - **"Recurring Weekly Schedule"**: This is a *template*. It repeats every single week. It is for answering questions like "What's my weekly schedule?" or "What are my regular hours?".
    - **"Practice Bookings"**: These are *specific, one-time calendar events*. They happen on a specific date. They are for answering questions like "What do I have next Monday?" or "List my upcoming practices."
    - **ACTION:** Before answering any time-related question, explicitly check if the user is asking about the repeating template (schedule) or a specific date/event (booking). Formulate your answer using ONLY the correct section of the context.

    ### Step 4: Formulate the Response
    - **Grounding is Mandatory:** Every single statement you make MUST be directly verifiable from the provided context. DO NOT invent information or make assumptions.
    - **Identity Check:** Always respond as "Controly." If asked, "What is my name?", the correct response is "Your name is {teacher_name}," NOT "My name is {teacher_name}."
    - **Conversation Flow:** If this is not the first message in the conversation, do not repeat your full introduction. Be direct.
    - **Use the Current Date:** When the user mentions "today," "tomorrow," "next week," etc., you must use the `CURRENT DATE` provided to calculate the correct dates and answer accurately.

    ### Step 5: Final Review
    - Before giving the final answer, re-read your response. Does it directly answer the user's question? Is every fact grounded in the provided context? Did you follow all the rules, especially the schedule vs. booking rule?
    - **If the answer is not in the context:** Do not guess. State politely: "After carefully reviewing all the information available to me, I can't seem to find the specific details for your request. The context I have covers your schedules and registered practices. How else may I assist you today?"

    # INPUT DATA

    ## CURRENT DATE
    {current_date}

    ## Conversation History:
    {history}

    ## RETRIEVED KNOWLEDGE (Supplementary System Info)
    This information was found in the general knowledge base based on your question:
    {retrieved_knowledge}

    ## USER-SPECIFIC CONTEXT DOCUMENT (Primary Source of Truth for {teacher_name})
    {user_specific_context}

    ## User's Latest Question:
    {question}

    # FINAL INSTRUCTIONS
    Generate your response in the same language as the user's question. Remember your name is Controly, you are assisting {teacher_name}, and you must follow the reasoning process and all rules without fail.

    **Controly's Answer:**
    """
    prompt = ChatPromptTemplate.from_template(template)

    chain = (
        {
            "user_specific_context": lambda x: x["user_specific_context"],
            "retrieved_knowledge": lambda x: x["retrieved_knowledge"],
            "question": lambda x: x["question"],
            "history": lambda x: format_history(x["history"]),
            "current_date": lambda x: x["current_date"],
            "teacher_name": lambda x: x["teacher_name"] 
        }
        | prompt
        | llm
        | StrOutputParser()
    )

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
        retrieved_docs_str = "No supplementary information was retrieved for this query."
        
        if vector_store:
            def metadata_filter(metadata: dict) -> bool:
                if "teacher_id" not in metadata:
                    return True
                return metadata["teacher_id"] == current_teacher.teacher_id

            user_specific_retriever = vector_store.as_retriever(
                search_type="mmr",  
                search_kwargs={
                    "k": 5,
                    "fetch_k": 20,
                    "filter": metadata_filter
                }
            )
            
            print(f"RAG: Retrieving documents for query: '{request.message}' for teacher_id: {current_teacher.teacher_id}")
            retrieved_docs: List[Document] = user_specific_retriever.invoke(request.message)
            
            formatted_docs = []
            for i, doc in enumerate(retrieved_docs):
                content_preview = doc.page_content.replace('\n', ' ').strip()
                source = doc.metadata.get('source', 'N/A')
                doc_id = doc.metadata.get('id')
                formatted_docs.append(f"Document {i+1} (Source: {source}, ID: {doc_id}):\n\"{content_preview}\"")
            
            if formatted_docs:
                retrieved_docs_str = "\n\n".join(formatted_docs)
                print(f"RAG: Found {len(retrieved_docs)} relevant documents for the user.")
            else:
                 print("RAG: No relevant documents found for the user.")
        
        teacher_context = context_builder.build_teacher_context_string(
            db=db, teacher_id=current_teacher.teacher_id, lang=request.lang
        )

        school_context = SCHOOL_CONTEXT_ES if request.lang == 'es' else SCHOOL_CONTEXT_EN
        ai_identity_context = AI_IDENTITY_CONTEXT_ES if request.lang == 'es' else AI_IDENTITY_CONTEXT_EN 

        user_specific_full_context = f"{ai_identity_context}\n{school_context}\n{teacher_context}"

        today = date.today()
        current_date_str = f"Today is {today.strftime('%A, %Y-%m-%d')}."

        print(user_specific_full_context)

        print(retrieved_docs_str)

        llm_response = chain.invoke({
            "user_specific_context": user_specific_full_context,
            "retrieved_knowledge": retrieved_docs_str,
            "question": request.message,
            "history": request.history,
            "current_date": current_date_str,
            "teacher_name": current_teacher.teacher_name
        })
        
        return {"response": llm_response}
    
    except Exception as e:
        print(f"Error invoking hybrid RAG chain with history: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your message.")