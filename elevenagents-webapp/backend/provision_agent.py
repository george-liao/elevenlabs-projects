"""
Provision the Aerial SG voice agent — RAG-grounded, run once.

What this does, end to end:
  1. Uploads every file in ./rag_files (and any URLs in rag_urls.txt) to your
     ElevenLabs Knowledge Base.
  2. Builds (computes) a RAG index over each uploaded document and waits for it.
  3. Creates a PUBLIC conversational agent whose system prompt is grounded with
     those knowledge-base documents and has RAG enabled.
  4. Writes the resulting agent id back into backend/.env (ELEVENLABS_AGENT_ID).

Run it again any time you change the knowledge base — pass --recreate to make a
brand-new agent, or it will update the existing one in place.

Usage:
    cd backend
    source .venv/bin/activate
    python provision_agent.py            # create or update the agent
    python provision_agent.py --recreate # force a fresh agent

All SDK method paths below are for the `elevenlabs` Python SDK v2.x
(namespace: client.conversational_ai.*). The API key is read from .env and
never leaves the server.
"""

import argparse
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv, set_key
from elevenlabs.client import ElevenLabs

# ── Configuration ───────────────────────────────────────────────────────────

HERE = Path(__file__).resolve().parent
ENV_PATH = HERE / ".env"
RAG_DIR = HERE / "rag_files"
RAG_URLS_FILE = HERE / "rag_urls.txt"

load_dotenv(ENV_PATH)

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
PLACEHOLDER = "YOUR_ELEVENLABS_API_KEY_HERE"
AGENT_NAME = os.getenv("AGENT_NAME", "Aerial SG Concierge").strip()
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb").strip()
EMBEDDING_MODEL = os.getenv("ELEVENLABS_RAG_EMBEDDING_MODEL", "e5_mistral_7b_instruct").strip()
EXISTING_AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "").strip()

# File extensions ElevenLabs can ingest, mapped to the MIME type the API
# expects. We send the content type explicitly because Python's mimetypes
# guesses "application/octet-stream" for .md, which the API rejects with
# `invalid_file_type`. Allowed types per the API: application/pdf,
# application/epub+zip, application/vnd.openxmlformats-...wordprocessingml.document,
# text/plain, text/html, text/markdown.
EXT_TO_MIME = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".html": "text/html",
    ".htm": "text/html",
    ".epub": "application/epub+zip",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
SUPPORTED_EXTS = set(EXT_TO_MIME)

# Files in rag_files/ that are project scaffolding, not knowledge to ingest.
SKIP_FILENAMES = {"readme.md"}

# The persona / behaviour for the grounded agent. Tuned for a premium SG carrier.
SYSTEM_PROMPT = """\
You are the Aerial SG Concierge — the AI voice assistant for Aerial, a premium \
international airline headquartered in Singapore serving the global premium \
travel segment.

Your job is to help travellers with flights, fares, cabin classes (Business, \
First, and the Aerial Suites), baggage, lounges, loyalty (AerialClub), routes, \
and travel policies, in a warm, polished, concise concierge tone.

Grounding rules:
- ALWAYS prefer information retrieved from your knowledge base. When a traveller \
  asks about routes, fares, policies, baggage, lounges, or loyalty, base your \
  answer on the retrieved documents rather than guessing.
- If the knowledge base does not contain the answer, say so plainly and offer \
  to connect the traveller to a human concierge — do not invent specifics such \
  as prices, schedules, or policy numbers.
- Keep spoken answers short and natural (1–3 sentences) unless asked for detail. \
  Confirm key details (dates, cities, cabin) back to the traveller.
- You are a voice agent: avoid reading out long lists, URLs, or tables verbatim. \
  Summarise and offer to go deeper.

Always be courteous, calm, and efficient — the Aerial standard."""

FIRST_MESSAGE = (
    "Welcome to Aerial. I'm your Singapore concierge — how can I help you "
    "plan your journey today?"
)


# ── Helpers ─────────────────────────────────────────────────────────────────

def fail(msg: str) -> None:
    print(f"\n✖ {msg}", file=sys.stderr)
    sys.exit(1)


def build_client() -> ElevenLabs:
    if not API_KEY or API_KEY == PLACEHOLDER:
        fail("ELEVENLABS_API_KEY is not set. Edit backend/.env and add your key.")
    return ElevenLabs(api_key=API_KEY)


def discover_files() -> list[Path]:
    if not RAG_DIR.exists():
        return []
    files = [
        p
        for p in sorted(RAG_DIR.iterdir())
        if p.is_file()
        and p.suffix.lower() in SUPPORTED_EXTS
        and not p.name.startswith(".")
        and p.name.lower() not in SKIP_FILENAMES
    ]
    return files


def discover_urls() -> list[str]:
    if not RAG_URLS_FILE.exists():
        return []
    urls = []
    for line in RAG_URLS_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    return urls


def upload_documents(client: ElevenLabs) -> list[dict]:
    """Upload files + URLs to the knowledge base. Returns KB entries:
    [{"type": "file"|"url", "id": ..., "name": ...}, ...]
    """
    entries: list[dict] = []

    files = discover_files()
    urls = discover_urls()

    if not files and not urls:
        print(
            f"⚠  No knowledge-base sources found.\n"
            f"   Drop documents into {RAG_DIR}/ (pdf, txt, md, docx, html, epub)\n"
            f"   and/or add URLs (one per line) to {RAG_URLS_FILE}.\n"
            f"   Continuing — the agent will be created WITHOUT grounding."
        )
        return entries

    for path in files:
        print(f"  ↑ uploading file: {path.name}")
        mime = EXT_TO_MIME[path.suffix.lower()]
        with path.open("rb") as fh:
            # Pass an explicit (filename, content, content_type) tuple so the API
            # gets a valid MIME type instead of octet-stream.
            doc = client.conversational_ai.knowledge_base.documents.create_from_file(
                file=(path.name, fh, mime),
                name=path.stem,
            )
        entries.append({"type": "file", "id": doc.id, "name": doc.name})

    for url in urls:
        print(f"  ↑ uploading url:  {url}")
        doc = client.conversational_ai.knowledge_base.documents.create_from_url(
            url=url,
            name=url,
        )
        entries.append({"type": "url", "id": doc.id, "name": doc.name})

    return entries


def compute_rag_indexes(client: ElevenLabs, entries: list[dict]) -> None:
    """Trigger and wait for the RAG index of each document.

    Documents under ~500 bytes can't be indexed (they get injected into the
    prompt directly instead), so a failure to index is logged, not fatal.
    """
    for entry in entries:
        doc_id = entry["id"]
        print(f"  ⚙ indexing: {entry['name']}", end="", flush=True)
        try:
            resp = client.conversational_ai.knowledge_base.document.compute_rag_index(
                documentation_id=doc_id,
                model=EMBEDDING_MODEL,
            )
        except Exception as exc:  # noqa: BLE001 — surface but keep going
            print(f"  (skipped: {exc})")
            continue

        # Poll until the index reaches a terminal state. Besides succeeded/
        # failed, the API may immediately return states that won't change —
        # e.g. document_too_small (under ~500 bytes, injected into the prompt
        # instead), rag_limit_exceeded, or cannot_index_folder.
        terminal = {
            "succeeded",
            "failed",
            "document_too_small",
            "rag_limit_exceeded",
            "cannot_index_folder",
        }
        status = getattr(resp, "status", None)
        waited = 0
        while status not in terminal and status is not None and waited < 120:
            time.sleep(3)
            waited += 3
            print(".", end="", flush=True)
            try:
                resp = client.conversational_ai.knowledge_base.document.compute_rag_index(
                    documentation_id=doc_id,
                    model=EMBEDDING_MODEL,
                )
                status = getattr(resp, "status", None)
            except Exception:  # noqa: BLE001
                break
        print(f"  [{status or 'ok'}]")


def build_conversation_config(kb_entries: list[dict]) -> dict:
    """Assemble the agent's conversation_config with prompt, KB, RAG, voice."""
    knowledge_base = [
        {"type": e["type"], "name": e["name"], "id": e["id"], "usage_mode": "auto"}
        for e in kb_entries
    ]

    return {
        "agent": {
            "first_message": FIRST_MESSAGE,
            "prompt": {
                "prompt": SYSTEM_PROMPT,
                "llm": "gpt-4o-mini",
                "knowledge_base": knowledge_base,
                "rag": {
                    "enabled": bool(knowledge_base),
                    "embedding_model": EMBEDDING_MODEL,
                },
            },
        },
        "tts": {
            "voice_id": VOICE_ID,
        },
    }


def persist_agent_id(agent_id: str) -> None:
    """Write ELEVENLABS_AGENT_ID back into backend/.env."""
    if not ENV_PATH.exists():
        ENV_PATH.write_text(
            f"ELEVENLABS_API_KEY={API_KEY}\nELEVENLABS_AGENT_ID={agent_id}\n",
            encoding="utf-8",
        )
        return
    set_key(str(ENV_PATH), "ELEVENLABS_AGENT_ID", agent_id)


# ── Main ────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Provision the Aerial SG voice agent.")
    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Create a brand-new agent even if ELEVENLABS_AGENT_ID is set.",
    )
    args = parser.parse_args()

    client = build_client()

    print("→ Uploading knowledge-base sources…")
    kb_entries = upload_documents(client)

    if kb_entries:
        print("→ Building RAG indexes (this can take a minute)…")
        compute_rag_indexes(client, kb_entries)

    config = build_conversation_config(kb_entries)

    reuse = EXISTING_AGENT_ID and not args.recreate
    if reuse:
        print(f"→ Updating existing agent {EXISTING_AGENT_ID}…")
        agent = client.conversational_ai.agents.update(
            agent_id=EXISTING_AGENT_ID,
            conversation_config=config,
        )
        agent_id = EXISTING_AGENT_ID
    else:
        print(f"→ Creating agent “{AGENT_NAME}”…")
        agent = client.conversational_ai.agents.create(
            name=AGENT_NAME,
            conversation_config=config,
        )
        # The create response exposes the new id as `agent_id`.
        agent_id = getattr(agent, "agent_id", None) or getattr(agent, "id", None)
        if not agent_id:
            fail(f"Could not read the new agent id from the API response: {agent!r}")

    persist_agent_id(agent_id)

    grounded = "with RAG grounding" if kb_entries else "WITHOUT grounding (no KB files)"
    print(
        f"\n✓ Done. Agent {agent_id} is ready {grounded}.\n"
        f"  Saved ELEVENLABS_AGENT_ID to {ENV_PATH}.\n"
        f"\n  Next:\n"
        f"   1. Make sure the agent is set to PUBLIC in the ElevenLabs dashboard\n"
        f"      (Agents → {AGENT_NAME} → Security → enable public/unauthenticated),\n"
        f"      or switch the frontend to signed-URL auth (see README).\n"
        f"   2. Start the backend:  uvicorn main:app --reload --port 8000\n"
        f"   3. Start the frontend: (in ../frontend)  npm run dev\n"
    )


if __name__ == "__main__":
    main()
