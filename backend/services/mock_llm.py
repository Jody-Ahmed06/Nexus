"""
Mock LLM Service — returns realistic, structured mock responses.
In production, replace these with real OpenAI / Gemini API calls.
"""
import random
from typing import Optional


# ---------------------------------------------------------------------------
# System Prompt Generator
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """You are Alex, a senior technical interviewer at a top-tier tech company.
You are conducting a structured 30-minute mock interview for the following candidate profile:

--- CANDIDATE OVERVIEW ---
{cv_summary}

--- ROLE BEING APPLIED FOR ---
{jd_summary}

--- YOUR INTERVIEW STYLE ---
- Ask one focused question at a time and wait for the candidate's full answer.
- Probe deeper with follow-up questions when answers are vague or incomplete.
- Maintain a professional but encouraging tone.
- Cover these areas in order: (1) Introduction & Background, (2) Technical Skills, (3) Behavioral Questions (STAR format), (4) Problem-Solving, (5) Candidate Questions.
- After the candidate has answered 4-5 questions, wrap up gracefully.

Start by introducing yourself warmly and asking the candidate to walk you through their background."""


def generate_system_prompt(cv_text: Optional[str], job_description: Optional[str]) -> str:
    """
    Build a structured interviewer system prompt from CV text and JD.
    Falls back to generic summaries when inputs are missing/empty.
    """
    cv_summary = (
        cv_text[:800].strip() if cv_text and len(cv_text) > 50
        else "Software Engineer with 3+ years of experience in web development and cloud infrastructure."
    )

    jd_summary = (
        job_description[:600].strip() if job_description and len(job_description) > 50
        else "Senior Full-Stack Engineer — Python, React, AWS, microservices architecture."
    )

    return SYSTEM_PROMPT_TEMPLATE.format(
        cv_summary=cv_summary,
        jd_summary=jd_summary,
    )


# ---------------------------------------------------------------------------
# Mock Feedback Generator
# ---------------------------------------------------------------------------

FEEDBACK_BANK = [
    {
        "technical": 82,
        "communication": 74,
        "confidence": 79,
        "overall": 78,
        "detailed_feedback": (
            "You demonstrated solid foundational knowledge across the technical topics covered. "
            "Your explanation of REST API design principles was particularly strong, and you showed "
            "good awareness of trade-offs in system design. Your STAR-formatted answers in behavioral "
            "sections were clear and well-structured. Areas where you excelled: problem decomposition "
            "and clear communication of your thought process."
        ),
        "areas_for_improvement": [
            "Consider practicing more complex algorithmic problems (Big-O analysis came up a few times where deeper insight would help).",
            "Reduce filler words such as 'um', 'like', and 'you know' — they undermine your otherwise strong communication.",
            "Be more concise in your initial answer before elaborating — interviewers appreciate clarity first.",
            "Prepare 2–3 strong failure stories using the STAR method; these reveal resilience and self-awareness.",
        ],
    },
    {
        "technical": 68,
        "communication": 80,
        "confidence": 85,
        "overall": 77,
        "detailed_feedback": (
            "Your communication and confidence were your strongest assets during this interview. "
            "You spoke clearly, maintained good energy, and handled the behavioral questions with "
            "compelling stories. On the technical side, there were a few knowledge gaps — particularly "
            "around distributed systems and database indexing strategies — that you'll want to address "
            "before your next round with a senior engineer."
        ),
        "areas_for_improvement": [
            "Deepen your understanding of database internals: indexing, query planning, and transaction isolation levels.",
            "Study common distributed systems patterns: CAP theorem, eventual consistency, and leader election.",
            "Practice live coding in a timed environment — the pressure seemed to affect your performance.",
            "Ask more clarifying questions before diving into a problem; it shows structured thinking.",
        ],
    },
    {
        "technical": 76,
        "communication": 71,
        "confidence": 73,
        "overall": 73,
        "detailed_feedback": (
            "You showed a good grasp of the technical concepts relevant to the role, with particularly "
            "insightful answers on API design and state management in frontend frameworks. "
            "Your confidence grew as the interview progressed, which is a great sign. "
            "The areas to focus on are around communication clarity — at times your answers rambled "
            "slightly before reaching the core point, which can lose an interviewer's attention."
        ),
        "areas_for_improvement": [
            "Practice the 'answer first, then elaborate' technique — lead with your conclusion, then support it.",
            "Work on conciseness: aim to answer most questions in under 90 seconds unless asked to elaborate.",
            "Your non-verbal presence (eye contact and posture) could reinforce your spoken confidence.",
            "Prepare structured answers for 'Why do you want to work here?' and 'Where do you see yourself in 5 years?'",
        ],
    },
]


def generate_feedback() -> dict:
    """
    Returns a randomised mock feedback object.
    In production, this would call an LLM with the interview transcript.
    """
    return random.choice(FEEDBACK_BANK)
