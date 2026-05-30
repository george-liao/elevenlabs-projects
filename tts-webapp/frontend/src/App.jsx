import { useEffect, useRef, useState } from "react";

const MAX_CHARS = 5000;

export default function App() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [clips, setClips] = useState([]); // { id, label, voiceName, url }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyConfigured, setKeyConfigured] = useState(true);

  // Auto-incrementing id for clips. A ref survives re-renders without re-render.
  const nextId = useRef(1);

  // On mount: check health + load voices.
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setKeyConfigured(Boolean(d.api_key_configured)))
      .catch(() => setKeyConfigured(false));

    fetch("/api/voices")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setVoices(d.voices || []);
        if (d.voices?.length) setVoiceId(d.voices[0].voice_id);
      })
      .catch(() => {
        /* No key yet, or offline — picker just stays empty (backend default used). */
      });
  }, []);

  // Revoke object URLs when clips are removed / on unmount to avoid leaks.
  useEffect(() => {
    return () => clips.forEach((c) => URL.revokeObjectURL(c.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConvert(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, voice_id: voiceId || null }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Request failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const voiceName =
        voices.find((v) => v.voice_id === voiceId)?.name || "Default voice";

      setClips((prev) => [
        {
          id: nextId.current++,
          label: trimmed.length > 90 ? trimmed.slice(0, 90) + "…" : trimmed,
          voiceName,
          url,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function removeClip(id) {
    setClips((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((c) => c.id !== id);
    });
  }

  return (
    <div className="page">
      <div className="orb orb--a" />
      <div className="orb orb--b" />

      <main className="shell">
        <header className="hero">
          <div className="logo">🎙️</div>
          <h1>
            Voixy<span className="dot">.</span>
          </h1>
          <p className="tagline">
            Turn text into lifelike speech with ElevenLabs.
          </p>
        </header>

        {!keyConfigured && (
          <div className="banner">
            ⚠️ ElevenLabs API key not configured. Add it to{" "}
            <code>backend/.env</code> and restart the backend.
          </div>
        )}

        <form className="card composer" onSubmit={handleConvert}>
          <textarea
            className="input"
            placeholder="Type something for the voice to say…"
            value={text}
            maxLength={MAX_CHARS}
            rows={5}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="controls">
            <select
              className="select"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={!voices.length}
            >
              {voices.length ? (
                voices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name}
                  </option>
                ))
              ) : (
                <option value="">Default voice</option>
              )}
            </select>

            <span className="counter">
              {text.length}/{MAX_CHARS}
            </span>

            <button
              className="btn"
              type="submit"
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Converting…
                </>
              ) : (
                "✨ Convert to speech"
              )}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </form>

        <section className="clips">
          <h2>
            Generated clips <span className="count">{clips.length}</span>
          </h2>

          {clips.length === 0 ? (
            <p className="empty">
              Your converted voices will appear here, ready to play.
            </p>
          ) : (
            <ul className="clip-list">
              {clips.map((c) => (
                <li className="card clip" key={c.id}>
                  <div className="clip-meta">
                    <span className="clip-voice">{c.voiceName}</span>
                    <p className="clip-text">{c.label}</p>
                  </div>
                  <div className="clip-actions">
                    <audio controls src={c.url} />
                    <a className="icon-btn" href={c.url} download={`voixy-${c.id}.mp3`} title="Download">
                      ⬇
                    </a>
                    <button
                      className="icon-btn"
                      onClick={() => removeClip(c.id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
