import ollama
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.database import get_db
from src.auth.security import get_current_teacher
from src.models.teacher import Teacher
from src.services.chat_service import TOOLS
from src.crud import crud_chat 
import json

router = APIRouter()

def get_tool_selection_prompt(user_query: str, user_context_yaml: str, history: list):
    tool_descriptions = "\n".join(
        f"- `{name}`: {info['description']} Parameters: {json.dumps(info['parameters'])}"
        for name, info in TOOLS.items()
    )
    chat_history = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in history])

    return f"""Your job is to select the single best tool to answer the user's latest message based on their query, their profile data, and the conversation history.
If the question can be answered from the profile data or history, choose "answer_from_context".
If a specific tool is needed for a new query, choose the appropriate tool.

USER PROFILE DATA (YAML format):
---
{user_context_yaml}
---

CONVERSATION HISTORY:
---
{chat_history}
---

AVAILABLE TOOLS:
---
{tool_descriptions}
---

Respond with a valid JSON object with "tool_name" and "parameters" keys.
'tool_name' MUST be one of: {list(TOOLS.keys()) + ['answer_from_context']}.
'parameters' MUST be an object.

User's LATEST message: "{user_query}"
"""

def get_final_response_prompt(user_query: str, tool_result: str, user_context_yaml: str, history: list, lang: str):
    language_instruction = "Formulate a helpful and natural response in Spanish." if lang == 'es' else "Formulate a helpful and natural response in English."
    chat_history = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in history])

    return f"""You are a helpful AI assistant named LabSy. You are speaking to a teacher.
Their profile data and the conversation history are provided below. Use this information as your primary source of truth.
Do not re-introduce yourself if the conversation has already started. Be concise and direct.

USER PROFILE DATA:
---
{user_context_yaml}
---

CONVERSATION HISTORY:
---
{chat_history}
---

The user's latest message was: "{user_query}"
A tool was run that returned this data: "{tool_result}"

Based on ALL the information above (profile, history, and tool result), formulate a natural language response. {language_instruction}
Directly answer the user's latest message. Avoid apologies unless a tool explicitly failed.
If the tool result contains a list, present it cleanly with bullets.
"""

class ChatRequest(BaseModel):
    message: str
    history: list = []
    lang: str

@router.post("")
async def handle_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    try:
        user_context_yaml = crud_chat.get_full_teacher_profile(db, current_teacher.teacher_id)

        tool_prompt = get_tool_selection_prompt(request.message, user_context_yaml, request.history)
        tool_response = ollama.chat(model='llama3.2', messages=[{'role': 'user', 'content': tool_prompt}], format='json')
        
        try:
            tool_call = json.loads(tool_response['message']['content'])
        except json.JSONDecodeError:
            tool_call = {"tool_name": "answer_from_context"}

        tool_name = tool_call.get("tool_name")
        parameters = tool_call.get("parameters", {})
        
        if tool_name and tool_name in TOOLS:
            tool_info = TOOLS[tool_name]
            tool_function = tool_info["function"]
            expected_params = {param['name'] for param in tool_info['parameters']}
            valid_params = {k: v for k, v in parameters.items() if k in expected_params}
            full_params = {"db": db, "teacher_id": current_teacher.teacher_id, **valid_params}
            tool_result = tool_function(**full_params)
        else:
            tool_result = "The answer should be in the provided user profile data or conversation history."

        final_prompt = get_final_response_prompt(request.message, str(tool_result), user_context_yaml, request.history, request.lang)
        final_response = ollama.chat(model='llama3.2', messages=[{'role': 'user', 'content': final_prompt}])
        
        return {"response": final_response['message']['content']}

    except Exception as e:
        print(f"Chat error: {e}")
        error_message = "Lo siento, encontré un error. Por favor, intenta preguntar de otra manera."
        return {"response": error_message}