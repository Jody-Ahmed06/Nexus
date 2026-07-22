import requests
import json

res = requests.post(
    "http://127.0.0.1:8000/api/generate-feedback",
    json={
        "eye_contact_score": 90,
        "transcript": "Alex: Hello, I am the interviewer. Let us begin.\nCandidate: Hello, I am ready for the interview and my skills include React and Python."
    }
)
print(res.json())
