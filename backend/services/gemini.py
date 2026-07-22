"""
Gemini service — uses the new google-genai SDK (replaces deprecated google-generativeai).
"""
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from typing import Optional

# Load .env before reading the key (handles any import-order issues)
load_dotenv()

_client: genai.Client | None = None

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        key = os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise ValueError("GEMINI_API_KEY not set in environment / .env")
        _client = genai.Client(api_key=key)
    return _client

INTERVIEWER_SYSTEM = (
    "You are Alex, a senior technical interviewer at a top tech company. "
    "STRICT RULES you must ALWAYS follow:\n"
    "1. Respond DIRECTLY and SPECIFICALLY to what the candidate just said — reference their exact words.\n"
    "2. If the answer is vague, off-topic, gibberish, or nonsensical: DO NOT say 'excellent', 'great', or 'interesting'. "
    "Instead say something like: 'I'm not sure I follow — could you give me a concrete example?' or "
    "'That doesn't quite answer my question. Let me rephrase: ...'\n"
    "3. Keep replies SHORT: 1-3 sentences of feedback/acknowledgment, then ONE follow-up question.\n"
    "4. Ask ONE question at a time. Never two.\n"
    "5. Cover these areas in order: Introduction → Technical depth → Behavioural (STAR) → Problem-solving → Candidate questions.\n"
    "6. After 5-6 exchanges, wrap up the interview warmly and tell the candidate you'll review their answers."
)


async def chat_with_gemini(
    user_message: str,
    history: list[dict],
    system_prompt: Optional[str] = None,
) -> str:
    """
    Send a message to Gemini 2.0 Flash with full conversation history.
    Returns the model's reply as a plain string.
    """
    try:
        # Build the contents list from history + current message
        contents: list[types.Content] = []
        for turn in history:
            role = "user" if turn["role"] == "user" else "model"
            contents.append(
                types.Content(role=role, parts=[types.Part(text=turn["content"])])
            )

        # Optionally prefix the first user message with CV/JD context
        message_text = user_message
        if system_prompt and not history:
            message_text = (
                f"[Interview context — candidate CV & role: {system_prompt[:400]}]\n\n"
                f"Candidate says: {user_message}"
            )

        contents.append(
            types.Content(role="user", parts=[types.Part(text=message_text)])
        )

        client = _get_client()
        response = await client.aio.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=INTERVIEWER_SYSTEM,
                temperature=0.7,
                max_output_tokens=220,
            ),
        )

        return response.text.strip()

    except Exception as e:
        err_msg = str(e)
        print(f"[Gemini] Error: {err_msg}")
        if "Quota" in err_msg or "429" in err_msg:
            return "I'm currently receiving too many requests due to API limits. Please wait a minute before answering again."
        return "I didn't quite catch that — could you repeat your answer with a bit more detail?"

async def generate_smart_system_prompt(cv_text: Optional[str], job_description: Optional[str]) -> str:
    """
    Use Gemini to read the CV and Job Description and generate a highly tailored 
    interviewer system prompt with predicted questions.
    """
    cv = cv_text[:2500].strip() if cv_text else "None provided."
    jd = job_description[:2500].strip() if job_description else "None provided."
    
    prompt = f"""
    You are an expert technical recruiter and interviewer.
    I need you to generate a custom 'System Prompt' that will be fed to an AI interviewer.
    
    Candidate's CV Extract:
    {cv}
    
    Job Description Extract:
    {jd}
    
    Instructions:
    Generate a 3-paragraph summary of the candidate's profile in the context of the job description.
    Then, list the 5 MOST PREDICTED, highly-targeted interview questions you would ask this candidate.
    Do not output any markdown formatting, just plain text that the AI interviewer will read as context.
    Make it clear, concise, and focused on the overlap (or gaps) between the CV and JD.
    """
    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Prompt] Error: {e}")
        return "You are an AI interviewer. Interview the candidate."

async def generate_smart_feedback(transcript: str) -> dict:
    """
    Use Gemini to read the interview transcript and output JSON scorecard data.
    """
    if not transcript or len(transcript.strip()) < 20:
        return {
            "technical": 0, "communication": 0, "confidence": 0, "overall": 0,
            "detailed_feedback": "Not enough conversation to analyze.",
            "areas_for_improvement": ["Complete a full interview first."]
        }

    schema = {
        "type": "OBJECT",
        "properties": {
            "technical": {"type": "INTEGER", "description": "Score 0-100"},
            "communication": {"type": "INTEGER", "description": "Score 0-100"},
            "confidence": {"type": "INTEGER", "description": "Score 0-100"},
            "overall": {"type": "INTEGER", "description": "Score 0-100"},
            "detailed_feedback": {"type": "STRING", "description": "1 paragraph of detailed feedback"},
            "areas_for_improvement": {
                "type": "ARRAY", 
                "items": {"type": "STRING"},
                "description": "3-4 actionable bullet points"
            }
        },
        "required": ["technical", "communication", "confidence", "overall", "detailed_feedback", "areas_for_improvement"]
    }

    # التعديل حصل هنا: حطينا معايير صارمة للموديل عشان ميظلمش اليوزر في الانترفيو القصير
    evaluator_prompt = f"""
    You are an expert technical interviewer evaluator.
    Analyze the following interview transcript and grade the candidate accurately.
    
    CRITICAL SCORING RULES:
    1. Base your scores ONLY on the questions asked and the candidate's actual answers.
    2. Do NOT penalize the candidate if the interview was short or incomplete. Treat the provided transcript as the complete context and grade proportionately.
    3. 'technical': Evaluate accuracy and depth of technical answers (0-100). If no technical questions were asked yet, give a default score of 70, not 0.
    4. 'communication': Evaluate clarity, conciseness, and lack of filler words (0-100).
    5. 'confidence': Evaluate assertiveness and directness (0-100).
    6. 'overall': Calculate the exact average of the three scores above.
    
    Transcript:
    {transcript[:8000]}
    """

    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=evaluator_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2,
            ),
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"[Gemini Feedback] Error: {e}")
        return {
            "technical": 50, "communication": 50, "confidence": 50, "overall": 50,
            "detailed_feedback": f"Failed to analyze transcript: {e}",
            "areas_for_improvement": ["Try again later."]
        }