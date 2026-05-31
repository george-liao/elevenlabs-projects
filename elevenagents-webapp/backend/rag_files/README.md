# Knowledge-base files (RAG sources)

Drop the documents you want the voice agent grounded on into **this folder**,
then run `python provision_agent.py` from `../backend`.

## Supported formats
`.pdf` · `.txt` · `.md` · `.docx` · `.html` / `.htm` · `.epub`

## Tips
- One topic per file works well (e.g. `routes.md`, `baggage-policy.pdf`,
  `aerialclub-loyalty.md`, `lounges.md`).
- Files under ~500 bytes are too small to index — they get injected into the
  prompt directly instead. That's fine, just expected.
- Plan limits apply to total indexed size (Free 1 MB → Creator 20 MB → higher
  on paid plans). See the ElevenLabs Knowledge Base docs.
- To ground on web pages instead of files, add URLs (one per line) to
  `../rag_urls.txt`.

A starter file, `aerial-sample-knowledge.md`, is included so you can test the
pipeline immediately — replace it with your real content.
