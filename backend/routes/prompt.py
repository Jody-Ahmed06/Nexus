"""
POST /api/generate-prompt
Accepts a CV (PDF) and a Job Description text, returns a system prompt string.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

from services.cv_parser import extract_text_from_pdf
from services.gemini import generate_smart_system_prompt

router = APIRouter()


@router.post("/generate-prompt")
async def generate_prompt(
    cv_file: Optional[UploadFile] = File(None),
    job_description: Optional[str] = Form(None),
):
    """
    Generate a custom AI interviewer system prompt from the user's CV and
    the target job description.
    """
    cv_text: Optional[str] = None

    # Parse the PDF if provided
    if cv_file and cv_file.filename:
        if not cv_file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported for CV upload.",
            )
        try:
            file_bytes = await cv_file.read()
            cv_text = extract_text_from_pdf(file_bytes)
        except Exception as e:
            # Non-fatal: fall back to generic prompt
            print(f"[generate-prompt] CV parse error: {e}")

    system_prompt = await generate_smart_system_prompt(
        cv_text=cv_text,
        job_description=job_description,
    )

    return JSONResponse(
        content={
            "system_prompt": system_prompt,
            "cv_parsed": cv_text is not None,
        }
    )
