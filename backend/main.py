"""
Ma2bool.ai — FastAPI Backend
Entrypoint: main.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.prompt import router as prompt_router
from routes.feedback import router as feedback_router
from routes.chat import router as chat_router

load_dotenv()

app = FastAPI(
    title="Ma2bool.ai API",
    description="AI-powered mock interview platform backend",
    version="1.0.0",
)

# Allow the Next.js dev server to hit this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prompt_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(chat_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ma2bool-api"}
