# ElevenLabs Projects

A collection of demos and apps built on the [ElevenLabs](https://elevenlabs.io) API.
Each project is self-contained, with its own setup instructions and `README`.

## Projects

| Project | Description | Stack |
| --- | --- | --- |
| [tts-webapp](./tts-webapp) | **Voixy** — a text-to-speech web app: type text, pick a voice, play the generated audio in the browser. | FastAPI · React (Vite) · ElevenLabs SDK |

_More to come: speech-to-text, voice cloning, dubbing…_

## Conventions

- **One folder per project**, named for its capability (e.g. `tts-webapp`, `speech-to-text`).
- **Dependencies stay per-project** — each has its own `requirements.txt` / `package.json`.
- **Secrets are never committed** — every project reads its API key from a local
  `.env` (git-ignored); see each project's `.env.example`.

## Getting started

Pick a project folder and follow its `README`. For example:

```bash
cd tts-webapp
# then follow tts-webapp/README.md
```
