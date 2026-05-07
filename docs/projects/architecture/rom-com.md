# ROM-COM — System Design Architecture

## Overview
KineticLab ROM-COM is a clinical rehabilitation companion system built for stroke recovery patients. It combines a real-time motion-tracking frontend with two independent AI-driven backend tracks: a live AI avatar coach (LiveAvatar) that responds to patient speech in under 2 seconds, and a scheduled iMessage reminder system (Photon) that delivers personalized daily check-ins. A MediaPipe pose pipeline classifies arm gestures and computes FMA-UE (Fugl-Meyer Assessment) subscale scores across five guided exercises.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS 4 |
| 3D / Animation | Three.js r184 · @react-three/fiber · @react-three/drei · Framer Motion 12 |
| Charts | Recharts 3 |
| State | Zustand 5 |
| Routing | React Router DOM 7 |
| Realtime Video | LiveKit Client 2 |
| Backend | FastAPI (Python) + WebSocket server |
| Pose Tracking | MediaPipe (landmark extraction pipeline) |
| Gesture ML | scikit-learn classifier (`gesture_classifier.pkl`) |
| AI Avatar | HeyGen LiveAvatar Lite (Track A) |
| TTS | ElevenLabs streaming (Track A) |
| ASR | Whisper / Deepgram (Track A) |
| LLM | Google Generative AI + clinical guardrails |
| iMessage | Photon Spectrum (Track B) |
| Scheduling | APScheduler (Track B — 8 AM daily) |
| Database | MongoDB Atlas (sessions, ROM profiles) |
| Hardware | Arduino (sensor bridge via `arduino_bridge.py`) |
| Deployment | Docker Compose (frontend port 5173, backend port 8000) |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                       │
│                  http://localhost:5173                       │
│                                                              │
│  Exercise UI · ROM dashboard · LiveAvatar video stream       │
│  Recharts analytics · Three.js 3D avatar overlay            │
└──────────────────────┬──────────────────────┬───────────────┘
                       │ WebSocket             │ LiveKit room
                       ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│              FastAPI Backend (port 8000)                     │
│                                                              │
│  ws://localhost:8000/ws   (gesture stream, exercise events)  │
│  POST /internal/gesture   (classifier → broadcast)          │
│  POST /avatar/start|stop  (LiveAvatar session management)   │
│  GET  /audio/{cue_name}   (Phase 2 — cached ElevenLabs MP3) │
│  GET  /session/{user_id}/latest  (Phase 3 — MongoDB)        │
│  POST /session/complete          (Phase 3 — persist results) │
│  POST /photon/inbound            (Photon iMessage webhook)   │
└───────────┬──────────────────────────┬───────────────────────┘
            │                          │
    ┌───────▼──────┐          ┌────────▼────────┐
    │ Track A      │          │ Track B          │
    │ LiveAvatar   │          │ Photon           │
    │              │          │                  │
    │ Patient ASR  │          │ APScheduler      │
    │ → LLM +      │          │ 8 AM daily cron  │
    │   guardrails │          │ → GET /session/  │
    │ → HeyGen     │          │ → LLM message    │
    │   avatar     │          │   generator      │
    │ → ElevenLabs │          │ → Photon iMessage│
    │   TTS stream │          │ → reply routing  │
    └──────────────┘          └─────────────────┘
            │
    ┌───────▼─────────────────────────────────────┐
    │            MediaPipe Pipeline               │
    │  mediapipe_tracker.py → feature_extractor   │
    │  → gesture_classifier.pkl → FMA scoring     │
    │  → POST /internal/gesture → WS broadcast    │
    └─────────────────────────────────────────────┘
            │
    ┌───────▼────────────────┐
    │     MongoDB Atlas      │
    │  Sessions · ROM        │
    │  profiles · streaks    │
    └────────────────────────┘
```

---

## Project Structure

```
rom-com/
├── src/                        # React + TypeScript frontend
├── public/                     # Static assets
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── schemas.py              # Pydantic request/response models
│   └── connection_manager.py   # WebSocket connection pool
├── kineticlab/
│   ├── audio/                  # ElevenLabs MP3 cache (Phase 2)
│   ├── liveavatar/             # HeyGen LiveAvatar client (Track A)
│   └── photon/                 # Photon Spectrum iMessage (Track B)
├── pipeline.py                 # End-to-end motion pipeline runner
├── mediapipe_tracker.py        # Landmark extraction
├── feature_extractor.py        # Feature engineering from landmarks
├── gesture_classifier.py       # ML gesture classifier training
├── gesture_classifier.pkl      # Trained model artifact
├── fma_scoring.py              # FMA-UE subscale scoring logic
├── arduino_bridge.py           # Arduino sensor data bridge
├── rom_calibration.py          # Per-user ROM baseline capture
├── collect_samples.py          # Training data collection utility
├── SCHEMA.md                   # WebSocket + HTTP contract (versioned)
├── docker-compose.yml          # Orchestrates frontend + backend
├── Dockerfile.frontend
└── requirements.txt
```

---

## WebSocket Message Schema (v1.1)

All WebSocket messages have the shape `{type, payload, timestamp}`.

**Client → Server**

| Type | Payload | Purpose |
|---|---|---|
| `ping` | `{}` | Health check |
| `calibration_start` | `{user_id}` | Begin ROM baseline capture |
| `calibration_complete` | `{rom_profile: {joint: [min, max]}}` | Finalize ROM |
| `exercise_start` | `{exercise: "target_reach" \| "trajectory_trace" \| "mirror_therapy" \| "forearm_rotation" \| "bimanual"}` | Begin exercise |
| `exercise_stop` | `{}` | End current exercise |

**Server → Client**

| Type | Payload | Purpose |
|---|---|---|
| `pong` | `{}` | Health reply |
| `gesture` | `{name, confidence, normalized_rom}` | Classified gesture |
| `rom_update` | `{joint, min, max}` | Live ROM update during calibration |
| `exercise_event` | `{target_hit, accuracy}` | Exercise milestone |
| `fma_score` | `{domain_a, domain_c, domain_e, total}` | End-of-session FMA-UE subscale |
| `audio_cue` | `{name, url}` | Trigger cached narration MP3 (Phase 2) |
| `error` | `{code, message}` | `LANDMARK_LOST` · `LOW_CONFIDENCE` · `CALIBRATION_FAILED` |

---

## LiveAvatar Session Lifecycle (Track A)

```
POST /avatar/start
  → Returns: session_id, livekit_url, livekit_client_token
  → Frontend joins LiveKit room → renders remote video track
  → Avatar speech: send {type: "speak", data: {text}} via LiveKit data channel
  → Text sourced from /ws (Gemini clinical_response() output)

POST /avatar/stop  { session_id }
  → Releases session credits (charges per active minute)
```

**Latency budget:** ASR → LLM → avatar response must complete in < 2 seconds end-to-end.

---

## Key Non-Negotiables

- Every LLM system prompt must include clinical guardrails verbatim (from `.claude/skills/clinical_prompt_guardrails.md`)
- Mock fallbacks (`MOCK_AVATAR=1`, `MOCK_PHOTON=1`) must work at all times
- Session data in MongoDB is **read-only** from Track B — never POST/PUT/DELETE
- No FDA validation claims in any copy, prompt, or UI text
- Photon iMessages must never induce guilt or anxiety
- FMA-UE scores are framed as "research-grade subscale proxy" only

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `LIVEAVATAR_API_KEY` | HeyGen LiveAvatar API key |
| `LIVEAVATAR_AVATAR_ID` | UUID of the avatar |
| `LIVEAVATAR_VOICE_ID` | ElevenLabs voice (optional — defaults to avatar built-in) |
| `LIVEAVATAR_SANDBOX` | `"true"` for free sandbox mode |
| `VITE_MOCK_MODE` | `true` runs frontend without live backend |

---

## Deployment

| Concern | Detail |
|---|---|
| Frontend | Vite dev server — `npm run dev` (port 5173) |
| Backend | FastAPI — `uvicorn` (port 8000) |
| Combined | `docker compose up --build -d` |
| Tests | `pytest` (kineticlab/tests) · `npm run lint` · `npm run build` |
