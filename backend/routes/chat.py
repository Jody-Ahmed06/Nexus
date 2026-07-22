"""
POST /api/chat
Real-time interview conversation endpoint.
Accepts the latest user message + full conversation history,
calls Gemini 2.0 Flash, returns the AI interviewer's reply.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from services.gemini import chat_with_gemini

router = APIRouter()


class Message(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []
    system_prompt: Optional[str] = None


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Receive the candidate's spoken (transcribed) message,
    return the AI interviewer's contextual reply.
    """
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]

    reply = await chat_with_gemini(
        user_message=req.message,
        history=history_dicts,
        system_prompt=req.system_prompt,
    )

    return JSONResponse(content={"reply": reply})
