"""
Aerial SG — voice-agent backend.

A thin FastAPI service that supports the React frontend's embedded ElevenLabs
voice agent. Because we connect the browser to a *public* agent (by id), the
runtime backend is intentionally tiny — it only tells the frontend which agent
to talk to and whether the server is configured:

  - GET /api/health  -> reports whether an API key + agent id are configured
  - GET /api/config  -> returns the public agent id the frontend should use

The heavy lifting (creating the agent, uploading knowledge-base files, building
the RAG index) lives in `provision_agent.py`, a one-off script you run once.

Why a backend at all for a public agent? Two reasons:
  1. The ElevenLabs API key is a billable secret and stays server-side — the
     provisioning script uses it; it never reaches the browser bundle.
  2. The agent id is delivered at runtime via /api/config, so you can swap
     agents (or run the provisioning script) without rebuilding the frontend.

If you later switch to a *private* agent (auth enabled), add a `/api/signed-url`
endpoint here that calls
`client.conversational_ai.conversations.get_signed_url(agent_id=...)` and have
the frontend pass the returned `signedUrl` to `startSession`. See the README.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "").strip()

# The placeholder shipped in .env.example; treat it as "not configured".
PLACEHOLDER = "YOUR_ELEVENLABS_API_KEY_HERE"


def _key_configured() -> bool:
    return bool(API_KEY) and API_KEY != PLACEHOLDER


app = FastAPI(title="Aerial SG Voice Agent API", version="1.0.0")

# Allow the Vite dev server (and common localhost ports) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    """Lightweight readiness probe the frontend uses to warn on misconfig."""
    return {
        "status": "ok",
        "api_key_configured": _key_configured(),
        "agent_configured": bool(AGENT_ID),
    }


@app.get("/api/config")
def config() -> dict:
    """Return the public agent id the frontend should connect to.

    `agent_id` is null when unconfigured so the UI can show a clear setup hint
    instead of failing to connect.
    """
    return {"agent_id": AGENT_ID or None}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
