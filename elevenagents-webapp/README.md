# ✈️ Aerial SG — RAG-grounded Voice Agent

A full-stack demo: a **premium Singapore-headquartered airline** marketing site
with an **ElevenLabs voice concierge** embedded on the right (~1/3 of the page).
The agent is grounded on a knowledge base via **ElevenLabs Agents + RAG**, so it
answers from *your* documents about routes, fares, cabins, baggage, lounges, and
loyalty — and politely declines to invent what it doesn't know.

- **Frontend:** React + Vite + TypeScript + Tailwind, using `@elevenlabs/react`'s
  `useConversation` hook for live voice.
- **Backend:** FastAPI. A tiny runtime service (tells the frontend which agent to
  use) plus a one-off **provisioning script** that uploads your RAG files, builds
  the RAG index, and creates the grounded agent — all via the ElevenLabs Python SDK.

---

## Architecture

**Runtime** — the browser connects directly to a public ElevenLabs agent over
WebRTC; the backend only tells it which agent to use.

```
┌───────────────────────────────────┐           ┌─────────────────────────┐     ┌────────────────┐
│ Browser  ·  React + Vite  :5173   │           │ FastAPI backend  :8000  │     │ ElevenLabs     │
│                                   │           │                         │     │ Agents + RAG   │
│ ┌────────────┐  ┌─────────────┐   │           │ GET /api/health         │     │                │
│ │ Airline    │  │ Voice       │   │── /api ──▶│ GET /api/config         │     │                │
│ │ site ~2/3  │  │ concierge   │   │           │     → { agent_id }      │     │                │
│ │            │  │   ~1/3      │   │           └─────────────────────────┘     │                │
│ └────────────┘  └─────────────┘   │                                           │                │
│                                   │                                           │                │
│                                   │                                           │   public agent │
└───────────────────────┴───────────┘                                           │                │
                        └───────────────────────────────────────────────────────▶                │
                          WebRTC voice  ·  startSession({ agentId })            └────────────────┘
```

**Provisioning** — run once (and whenever the knowledge base changes).

```
                               ┌───────────────────────────────┐    ┌────────────────┐
                               │ provision_agent.py  (SDK)     │    │ ElevenLabs     │
Run once  ·  on KB change ──▶  │                               │──▶ │ Knowledge Base │
                               │ upload → index → create agent │    │ + Agent        │
                               └───────────────────────────────┘    └────────────────┘
```

**Runtime flow**

1. The React app calls `GET /api/config` to learn which **public** agent id to use.
2. The user clicks **Talk to the concierge** → the app requests mic permission and
   calls `conversation.startSession({ agentId, connectionType: "webrtc" })`.
3. Audio streams directly between the browser and ElevenLabs over WebRTC. The
   `useConversation` hook surfaces connection status, speaking/listening mode,
   mute, volume, and a live transcript (via `onMessage`).

**Provisioning flow** (`provision_agent.py`, run once)

1. Uploads every file in `backend/rag_files/` (and any URLs in `rag_urls.txt`) to
   your ElevenLabs Knowledge Base.
2. Computes a **RAG index** for each document and waits for it to finish.
3. Creates a **public** agent whose prompt is grounded with those documents and
   has RAG enabled, then writes `ELEVENLABS_AGENT_ID` back into `backend/.env`.

**Why this split?** The ElevenLabs API key is a billable secret, so it lives only
server-side (used by the provisioning script). The browser talks to a *public*
agent by id — no key in the bundle. (Prefer not to expose a public agent? See
[Using a private agent](#using-a-private-agent-signed-url) below.)

### Key design decisions

| Decision | Rationale |
| --- | --- |
| **ElevenLabs Agents for voice** | One managed service handles the full real-time loop — speech-to-text, the LLM, RAG retrieval, and text-to-speech — so there is no STT/LLM/TTS pipeline to build, host, or keep in sync. We integrate one SDK instead of four. |
| **RAG grounding over a stuffed prompt** | The agent answers from an indexed knowledge base rather than a giant static prompt. Content scales without bloating every turn, updates by re-running one script, and the prompt instructs the agent to decline rather than hallucinate when retrieval comes up empty. |
| **Provisioning split from the runtime backend** | Uploading files, building the RAG index, and creating the agent are slow, one-off, key-bearing operations — wrong to do on a web request. They live in `provision_agent.py` (run on setup / KB change); the runtime backend stays stateless and fast. |
| **Public agent + thin FastAPI broker** | For a public agent the browser needs no server-side secret to connect, so routing audio through the backend would only add latency. FastAPI just serves the `agent_id` at runtime (via `/api/config`), so the agent can be swapped or re-provisioned without rebuilding the frontend. The same backend cleanly upgrades to minting signed URLs for a private agent — see below. |
| **Browser ↔ ElevenLabs over WebRTC** | Voice is latency-sensitive; WebRTC gives low-latency, full-duplex audio with built-in echo cancellation and jitter handling — better than proxying audio through our own server. |
| **`@elevenlabs/react` `useConversation` hook** | The official hook exposes connection status, speaking/listening mode, mute, volume, and transcript events as reactive state, so the UI (status orb, controls, live transcript) is a thin render of SDK state rather than hand-rolled WebRTC plumbing. |
| **FastAPI for the backend** | Async-native, minimal boilerplate, Pydantic validation, and auto-generated docs at `/docs` — well matched to a tiny JSON API, and shares the same Python runtime as the ElevenLabs SDK used for provisioning. |
| **Vite + React + TypeScript + Tailwind** | Vite for fast dev/HMR and a lean production bundle; TypeScript to type the SDK's event payloads and config; Tailwind to build the premium, interactive airline UI quickly without a separate stylesheet to maintain. |
| **Key from environment, never committed** | `ELEVENLABS_API_KEY` is read from `backend/.env` (git-ignored) and used only server-side; the placeholder is treated as "unconfigured" so the UI can warn clearly instead of failing silently. |

---

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- An **ElevenLabs API key** — <https://elevenlabs.io/app/settings/api-keys>
  (the Agents / Conversational AI feature must be available on your plan).

---

## Setup & Run

### 1. Configure & provision the agent (backend)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit .env and paste your API key
```

> **Add your key:** open `backend/.env` and set `ELEVENLABS_API_KEY=...`.

**Drop your RAG files** into `backend/rag_files/` (`.pdf`, `.txt`, `.md`, `.docx`,
`.html`, `.epub`). A sample file (`aerial-sample-knowledge.md`) is included so you
can test immediately — replace it with your real content. Optionally add web
pages (one URL per line) to `backend/rag_urls.txt`.

**Provision the agent:**

```bash
python provision_agent.py          # creates the agent, builds the RAG index,
                                    # and saves ELEVENLABS_AGENT_ID into .env
```

Then, in the [ElevenLabs dashboard](https://elevenlabs.io/app/agents), open the
new agent and make sure it's set to **public / allow unauthenticated** (Agent →
Security), since the browser connects by id. *(Or keep it private and switch the
frontend to signed-URL auth — see below.)*

**Run the backend:**

```bash
uvicorn main:app --reload --port 8000
```

### 2. Run the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open the printed URL (default <http://localhost:5173>) in Chrome and click
**Talk to the concierge** (allow the microphone when prompted).

---

## Configuration

Set in `backend/.env` (see `.env.example`):

| Variable                          | Description                                              | Default                  |
| --------------------------------- | -------------------------------------------------------- | ------------------------ |
| `ELEVENLABS_API_KEY`              | Your ElevenLabs API key (**required**, server-side only) | _placeholder_            |
| `ELEVENLABS_AGENT_ID`             | Public agent the frontend connects to (auto-filled)      | _empty_                  |
| `AGENT_NAME`                      | Name for the agent created by the script                 | `Aerial SG Concierge`    |
| `ELEVENLABS_VOICE_ID`             | Voice used by the agent's TTS                            | `JBFqnCBsd6RMkjVDRZzb`   |
| `ELEVENLABS_RAG_EMBEDDING_MODEL`  | Embedding model for the RAG index                        | `e5_mistral_7b_instruct` |

Re-run `python provision_agent.py` any time you change the knowledge base (it
updates the existing agent in place; pass `--recreate` to make a fresh one).

---

## API Reference (runtime backend)

| Method | Endpoint       | Returns                                                    |
| ------ | -------------- | ---------------------------------------------------------- |
| GET    | `/api/health`  | `{ status, api_key_configured, agent_configured }`         |
| GET    | `/api/config`  | `{ agent_id }` — the public agent id, or `null` if unset   |

---

## Project layout

```
elevenagents-webapp/
├── backend/
│   ├── main.py                 # FastAPI: /api/health, /api/config
│   ├── provision_agent.py      # one-off: upload KB → index RAG → create agent
│   ├── requirements.txt        # fastapi, uvicorn, elevenlabs, python-dotenv
│   ├── .env.example            # copy → .env, add your API key
│   ├── rag_urls.txt            # optional: ground on web pages (one URL per line)
│   └── rag_files/              # ← drop your RAG documents here
│       └── aerial-sample-knowledge.md
├── frontend/
│   ├── src/
│   │   ├── main.tsx            # wraps the app in <ConversationProvider>
│   │   ├── App.tsx             # layout: airline site (2/3) + voice panel (1/3)
│   │   ├── lib/api.ts          # calls /api/config + /api/health
│   │   └── components/
│   │       ├── airline/        # hero, flight search, routes, cabins, footer…
│   │       └── voice/          # VoiceAgentPanel (useConversation), Orb, Transcript
│   ├── vite.config.ts          # dev server + /api proxy → :8000
│   └── package.json
└── README.md
```

---

## Using a private agent (signed URL)

The default uses a **public** agent (simplest; the browser connects by id). To
keep the agent **private** so only your backend can authorize sessions:

1. In `backend/main.py`, add an endpoint:

   ```python
   from elevenlabs.client import ElevenLabs

   @app.get("/api/signed-url")
   def signed_url():
       client = ElevenLabs(api_key=API_KEY)
       res = client.conversational_ai.conversations.get_signed_url(agent_id=AGENT_ID)
       return {"signed_url": res.signed_url}
   ```

2. In `VoiceAgentPanel.tsx`, fetch it and start the session with the URL instead
   of the id:

   ```ts
   const { signed_url } = await (await fetch("/api/signed-url")).json();
   await startSession({ signedUrl: signed_url });   // connectionType: "websocket"
   ```

The API key still never reaches the browser — the backend mints a short-lived,
single-agent signed URL on demand.

---

## Troubleshooting

- **"No agent yet" in the panel** — run `python provision_agent.py` in `backend/`,
  then restart `uvicorn` so it picks up the new `ELEVENLABS_AGENT_ID`.
- **"Can't reach the backend"** — start it: `uvicorn main:app --reload --port 8000`.
- **Connects but can't talk / fails to start** — the agent may be private. Set it
  to public in the dashboard, or switch to the signed-URL flow above.
- **Microphone blocked** — allow mic access for `localhost:5173` in Chrome's site
  settings; voice mode requires it.
- **Indexing says `document_too_small`** — files under ~500 bytes can't be RAG
  indexed; ElevenLabs injects them into the prompt directly. That's expected.
- **CORS errors** — keep the frontend on port 5173/4173 (allowlisted in `main.py`).

---

## How the voice integration works (frontend)

`@elevenlabs/react` exposes hooks that must live inside a `ConversationProvider`
(set up once in `main.tsx`). `VoiceAgentPanel.tsx` uses `useConversation()`:

```ts
const conversation = useConversation({
  onConnect:    () => {},
  onDisconnect: () => {},
  onError:      (msg) => setError(msg),
  onMessage:    ({ message, source }) => addTurn(source, message), // "user" | "ai"
});

const { status, isSpeaking, isListening, isMuted, setMuted, setVolume,
        startSession, endSession } = conversation;

await startSession({ agentId, connectionType: "webrtc" });
```

`status` (`disconnected | connecting | connected`), `isSpeaking`/`isListening`,
and `isMuted` drive the animated orb, the status label, and the mute/volume
controls; `onMessage` feeds the live transcript.
```
