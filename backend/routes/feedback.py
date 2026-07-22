"""
POST /api/generate-feedback
Returns mock interview scores and AI feedback text.
In production: call an LLM with the full interview transcript.
"""
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from typing import Optional

from services.gemini import generate_smart_feedback

router = APIRouter()


@router.post("/generate-feedback")
async def get_feedback(
    eye_contact_score: Optional[int] = Body(None),
    transcript: Optional[str] = Body(None),
):
    print(f"[Feedback Route] Received eye_contact_score: {eye_contact_score}, transcript length: {len(transcript) if transcript else 0}")
    """
    Accept the eye contact score and optional transcript from the frontend,
    return comprehensive interview feedback.
    """
    if transcript:
        feedback = await generate_smart_feedback(transcript)
    else:
        # Fallback to empty shell if no transcript provided
        feedback = {
            "technical": 0, "communication": 0, "confidence": 0, "overall": 0,
            "detailed_feedback": "No transcript was provided to analyze.",
            "areas_for_improvement": []
        }

    # Override eye_contact with the real tracked value from the frontend
    if eye_contact_score is not None:
        feedback["eye_contact"] = max(0, min(100, eye_contact_score))
    else:
        # Fallback: generate a realistic default
        import random
        feedback["eye_contact"] = random.randint(55, 90)

    return JSONResponse(content=feedback)
