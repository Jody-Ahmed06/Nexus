import asyncio
from services.gemini import generate_smart_feedback

async def main():
    res = await generate_smart_feedback("Alex: Hello, I am the interviewer. Let us begin.\nCandidate: Hello, I am ready for the interview and my skills include React and Python.")
    print(res)

asyncio.run(main())
