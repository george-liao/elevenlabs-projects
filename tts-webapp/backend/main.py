"""
ElevenLabs TTS backend.

A thin FastAPI wrapper around the official ElevenLabs Python SDK. It exposes:
  - GET  /api/health   -> reports whether an API key is configured
  - GET  /api/voices   -> lists the voices available on the account
  - POST /api/tts      -> converts text to speech, returns MP3 audio bytes

The React frontend calls these endpoints. The ElevenLabs API key is read from
the environment (see .env.example) so it never lives in the frontend bundle.
"""

import io
import os
from typing import Optional

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
DEFAULT_VOICE_ID = os.getenv("ELEVENLABS_DEFAULT_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb").strip()
MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_v3").strip()

# The placeholder shipped in .env.example; treat it as "not configured".
PLACEHOLDER = "YOUR_ELEVENLABS_API_KEY_HERE"


def get_client() -> ElevenLabs:
    """Build an SDK client, failing loudly if the key is missing/placeholder."""
    if not API_KEY or API_KEY == PLACEHOLDER:
        raise HTTPException(
            status_code=503,
            detail="ELEVENLABS_API_KEY is not configured. Add it to backend/.env.",
        )
    return ElevenLabs(api_key=API_KEY)


app = FastAPI(title="ElevenLabs TTS API", version="1.0.0")

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


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: Optional[str] = None


@app.get("/api/health")
def health() -> dict:
    configured = bool(API_KEY) and API_KEY != PLACEHOLDER
    return {"status": "ok", "api_key_configured": configured}


@app.get("/api/voices")
def list_voices() -> dict:
    """Return the account's voices so the UI can offer a picker."""
    client = get_client()
    try:
        result = client.voices.get_all()
    except Exception as exc:  # surface SDK/HTTP errors as 502
        raise HTTPException(status_code=502, detail=f"ElevenLabs error: {exc}") from exc

    voices = [
        {"voice_id": v.voice_id, "name": v.name, "category": getattr(v, "category", None)}
        for v in result.voices
    ]
    return {"voices": voices}


@app.post("/api/tts")
def text_to_speech(req: TTSRequest) -> StreamingResponse:
    """Convert text to speech and stream back MP3 audio."""
    client = get_client()
    voice_id = (req.voice_id or DEFAULT_VOICE_ID).strip()

    try:
        # The SDK returns an iterator of audio chunks; join them into bytes.
        audio_stream = client.text_to_speech.convert(
            voice_id=voice_id,
            model_id=MODEL_ID,
            text=req.text,
            output_format="mp3_44100_128",
        )
        audio_bytes = b"".join(audio_stream)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"ElevenLabs error: {exc}") from exc

    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
