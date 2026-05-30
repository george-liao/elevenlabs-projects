# 🎙️ Voixy — ElevenLabs Text-to-Speech

A full-stack app that converts text to lifelike speech using the **ElevenLabs**
Python SDK. A FastAPI backend wraps the SDK; a React (Vite) frontend provides a
sleek UI where you type text, pick a voice, and play the generated audio
directly in Chrome.

---

## Architecture

```
┌──────────────────────┐         ┌────────────────────────┐         ┌─────────────────────┐
│ Browser              │         │ FastAPI Backend        │         │ ElevenLabs API      │
│ React + Vite  :5173  │         │ Python/Uvicorn :8000   │         │ (cloud service)     │
│                      │         │                        │         │                     │
│ Text box + voice     │  /api/* │ GET  /api/health       │   SDK   │ voices.get_all()    │
│ picker               │────────▶│ GET  /api/voices       │────────▶│ text_to_speech      │
│                      │         │ POST /api/tts          │         │ .convert() -> MP3   │
│ Clip list with       │   MP3   │                        │  audio  │                     │
│ <audio> players      │◀────────│ (ElevenLabs SDK)       │◀────────│                     │
└──────────────────────┘         └────────────────────────┘         └─────────────────────┘
```

**Request flow**

1. The React app loads and calls `GET /api/health` (to detect a missing key) and
   `GET /api/voices` (to populate the voice picker).
2. The user types text and clicks **Convert**. The app sends
   `POST /api/tts` with `{ text, voice_id }`.
3. The backend calls the ElevenLabs SDK's `text_to_speech.convert(...)`, joins the
   returned audio chunks into bytes, and streams them back as `audio/mpeg`.
4. The frontend wraps the response in a `Blob`, creates an object URL, and
   renders an HTML5 `<audio>` player — so playback works natively in Chrome.

**Why a backend?** The ElevenLabs API key stays server-side (in `backend/.env`),
never shipped in the browser bundle. The Vite dev server proxies `/api/*` to the
backend, so the frontend uses clean same-origin paths.

### Project layout

```
tts-webapp/
├── backend/
│   ├── main.py            # FastAPI app — health, voices, tts endpoints
│   ├── requirements.txt   # fastapi, uvicorn, elevenlabs, python-dotenv
│   └── .env.example       # copy → .env, add your API key
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # UI: text box, voice picker, clip list
│   │   ├── main.jsx       # React entrypoint
│   │   └── index.css      # glassmorphism + animated-orb styling
│   ├── index.html
│   ├── vite.config.js     # dev server + /api proxy → :8000
│   └── package.json
└── README.md
```

---

## Design Decisions

| Decision | Rationale |
| --- | --- |
| **Backend proxy in front of the SDK** | The ElevenLabs SDK is Python-only and the API key is a billable secret. A FastAPI layer runs the SDK server-side, keeping the key in `backend/.env` and out of the browser bundle. |
| **FastAPI + Uvicorn** | Minimal, async-native, with built-in request validation (Pydantic) and auto-generated docs at `/docs` — little boilerplate for a small JSON + binary API. |
| **Key loaded from environment** | The key is read from `.env` via `python-dotenv`, never hard-coded or committed (`.env` is git-ignored). The placeholder is treated as "unconfigured" so the UI can warn clearly. |
| **Audio streamed as `audio/mpeg`** | The SDK returns audio chunks; the backend joins them and returns a `StreamingResponse`. The frontend wraps it in a `Blob` + object URL so the native HTML5 `<audio>` element plays it directly — no third-party player needed. |
| **Vite dev server with `/api` proxy** | Lets the frontend call clean same-origin paths (`/api/*`) instead of hard-coding `localhost:8000`, sidestepping CORS friction in development. |
| **Model configurable via env** | `ELEVENLABS_MODEL_ID` (default `eleven_v3`) and the default voice are env-driven, so models/voices can change without code edits. |
| **Graceful degradation** | If the key lacks `voices_read`, the voice picker stays empty and the app falls back to the default voice ID rather than failing — conversion still works. |
| **Object-URL cleanup** | Generated clip URLs are revoked on removal and unmount to avoid memory leaks during long sessions. |

---

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- An **ElevenLabs API key** — get one at
  <https://elevenlabs.io/app/settings/api-keys>

---

## Setup & Run

Run the backend and frontend in two separate terminals.

### 1. Backend (FastAPI + ElevenLabs SDK)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit .env and paste your key
uvicorn main:app --reload --port 8000
```

Backend runs at <http://localhost:8000> (docs at `/docs`).

> **Add your key:** open `backend/.env` and set
> `ELEVENLABS_API_KEY=...`. The app shows a warning banner until a real key
> (not the placeholder) is present.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default <http://localhost:5173>) in Chrome.

---

## Usage

1. Type or paste text (up to 5,000 characters).
2. Pick a voice from the dropdown (populated from your account).
3. Click **✨ Convert to speech**.
4. Each result appears in the list below with an inline player —
   press play, or use **⬇** to download the MP3.

---

## Configuration

Set in `backend/.env` (see `.env.example`):

| Variable                       | Description                              | Default                  |
| ------------------------------ | ---------------------------------------- | ------------------------ |
| `ELEVENLABS_API_KEY`           | Your ElevenLabs API key (**required**)   | _placeholder_            |
| `ELEVENLABS_DEFAULT_VOICE_ID`  | Fallback voice if none selected          | `JBFqnCBsd6RMkjVDRZzb`   |
| `ELEVENLABS_MODEL_ID`          | TTS model to use                         | `eleven_v3`              |

> **Note on Eleven v3:** `eleven_v3` is ElevenLabs' most expressive model and
> supports inline audio tags (e.g. `[whispers]`, `[laughs]`, `[excited]`). It is
> released as **alpha**, and programmatic API access may need to be enabled on
> your account. If a conversion fails with a `502 ElevenLabs error`, your key may
> not have v3 API access yet — set `ELEVENLABS_MODEL_ID=eleven_multilingual_v2`
> as a stable fallback.

---

## API Reference

| Method | Endpoint       | Body                       | Returns                       |
| ------ | -------------- | -------------------------- | ----------------------------- |
| GET    | `/api/health`  | —                          | `{ status, api_key_configured }` |
| GET    | `/api/voices`  | —                          | `{ voices: [...] }`           |
| POST   | `/api/tts`     | `{ text, voice_id? }`      | `audio/mpeg` (MP3 bytes)      |

---

## Troubleshooting

- **Warning banner / 503 errors** — the key is missing or still the placeholder.
  Edit `backend/.env` and restart `uvicorn`.
- **Empty voice picker** — backend isn't running or the key is invalid; the app
  falls back to the default voice ID.
- **CORS errors** — make sure the frontend runs on port 5173/4173 (already
  allowlisted in `main.py`).
