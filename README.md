# Ma2bool.ai 🎙

> AI-powered mock interview platform with real-time voice streaming and client-side eye-contact tracking.

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend will be live at `http://localhost:8000`.
API docs: `http://localhost:8000/docs`

---

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

App will be live at `http://localhost:3000`.

---

## Environment Variables

Copy `.env.local` (already created) and configure:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | FastAPI backend URL. Default: `http://localhost:8000/api` |
| `NEXT_PUBLIC_VAPI_KEY` | ❌ | Vapi API key. **Leave unset** to use built-in Mock Mode |

### Live Vapi Mode
1. Sign up at [vapi.ai](https://vapi.ai)
2. Get your API key from the dashboard
3. Set `NEXT_PUBLIC_VAPI_KEY=your_key` in `.env.local`
4. Restart the dev server

---

## Architecture

```
k:\Nexus\
├── frontend/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx           → Setup View (Home)
│   │   ├── interview/page.tsx → Interview Room
│   │   └── scorecard/page.tsx → Scorecard Dashboard
│   ├── components/
│   │   ├── SetupView.tsx      # CV upload + JD textarea
│   │   ├── AudioOrb.tsx       # Glowing animated orb
│   │   ├── VideoFeed.tsx      # PiP webcam + eye badge
│   │   ├── Scorecard.tsx      # Dashboard with Recharts
│   │   └── ui/                # GlassCard, RadialProgress, etc.
│   ├── hooks/
│   │   ├── useVapi.ts         # Vapi SDK + Mock Mode
│   │   └── useEyeTracker.ts   # MediaPipe FaceLandmarker
│   ├── store/
│   │   └── interviewStore.ts  # Zustand global state
│   └── lib/
│       └── api.ts             # Backend API client
│
└── backend/
    ├── main.py                # FastAPI app + CORS
    ├── routes/
    │   ├── prompt.py          # POST /api/generate-prompt
    │   └── feedback.py        # POST /api/generate-feedback
    └── services/
        ├── cv_parser.py       # PyPDF2 extraction
        └── mock_llm.py        # Mock LLM responses
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 15 (App Router) |
| Styling | TailwindCSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Voice AI | @vapi-ai/web |
| Eye Tracking | @mediapipe/tasks-vision |
| Global State | Zustand |
| Backend | FastAPI (Python) |
| PDF Parsing | PyPDF2 |

## Flow

1. **Setup** → Upload CV PDF + paste Job Description → hit "Start Interview"
2. **Backend** generates a custom AI interviewer system prompt
3. **Interview Room** → Vapi starts voice session, MediaPipe tracks eye contact
4. **End Interview** → Scorecard loads with 4 animated metrics + AI feedback

## Demo Mode (No API Keys)

The app works completely offline/without API keys:
- **Vapi Mock Mode**: Simulates AI speaking with realistic timing
- **MediaPipe Fallback**: If WASM fails to load, mock eye contact % is generated
- **Backend Fallback**: If backend is offline, scorecard shows placeholder feedback
