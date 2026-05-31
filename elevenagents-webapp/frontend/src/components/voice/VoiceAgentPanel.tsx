import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { fetchConfig, fetchHealth } from "../../lib/api";
import { Orb } from "./Orb";
import { Transcript } from "./Transcript";
import type { TranscriptTurn } from "./types";

type Setup =
  | { phase: "loading" }
  | { phase: "ready"; agentId: string }
  | { phase: "unconfigured"; reason: string }
  | { phase: "error"; reason: string };

let turnSeq = 0;
const nextId = () => `${Date.now()}-${turnSeq++}`;

/**
 * The embedded ElevenLabs voice concierge.
 *
 * Flow:
 *  1. On mount, ask the backend (/api/config) which public agent to connect to.
 *  2. When the user clicks "Talk", request mic permission, then call
 *     `startSession({ agentId })` from the useConversation hook.
 *  3. Reflect connection status, speaking/listening mode, mute and volume, and
 *     render the live transcript from onMessage events.
 *
 * The hook must run inside the <ConversationProvider> set up in main.tsx.
 */
export function VoiceAgentPanel() {
  const [setup, setSetup] = useState<Setup>({ phase: "loading" });
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [volume, setVolumeState] = useState(0.8);
  const [micError, setMicError] = useState<string | null>(null);
  const startingRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => setMicError(null),
    onDisconnect: () => {
      startingRef.current = false;
    },
    onError: (message) => setMicError(typeof message === "string" ? message : "Connection error"),
    onMessage: ({ message, source }) => {
      // source is "user" (their transcribed speech) or "ai" (the agent reply).
      if (!message) return;
      setTurns((prev) => [
        ...prev,
        { id: nextId(), role: source === "user" ? "user" : "ai", text: message },
      ]);
    },
  });

  const { status, isSpeaking, isListening, isMuted, setMuted, startSession, endSession, setVolume } =
    conversation;

  // ── 1. Load agent config from the backend ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await fetchHealth().catch(() => null);
        const cfg = await fetchConfig();
        if (cancelled) return;

        if (cfg.agent_id) {
          setSetup({ phase: "ready", agentId: cfg.agent_id });
        } else if (health && !health.api_key_configured) {
          setSetup({
            phase: "unconfigured",
            reason: "No API key. Add ELEVENLABS_API_KEY to backend/.env.",
          });
        } else {
          setSetup({
            phase: "unconfigured",
            reason:
              "No agent yet. Run `python provision_agent.py` in backend/ to create one.",
          });
        }
      } catch {
        if (!cancelled) {
          setSetup({
            phase: "error",
            reason: "Can't reach the backend. Start it with `uvicorn main:app --port 8000`.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the SDK output volume in sync with the slider.
  useEffect(() => {
    if (status === "connected") {
      setVolume({ volume });
    }
  }, [volume, status, setVolume]);

  // ── 2. Start / stop the conversation ──────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (setup.phase !== "ready" || startingRef.current) return;
    startingRef.current = true;
    setMicError(null);
    setTurns([]);

    try {
      // Voice conversations need microphone access; request it up front so the
      // browser prompt appears on a clear user gesture.
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("Microphone access is required to talk to the concierge.");
      startingRef.current = false;
      return;
    }

    try {
      await startSession({ agentId: setup.agentId, connectionType: "webrtc" });
    } catch (err) {
      setMicError(err instanceof Error ? err.message : "Failed to start the session.");
      startingRef.current = false;
    }
  }, [setup, startSession]);

  const handleStop = useCallback(() => {
    endSession();
  }, [endSession]);

  // ── Derived UI state ──────────────────────────────────────────────────────
  const connected = status === "connected";
  const connecting = status === "connecting";
  const orbState = connecting
    ? "connecting"
    : connected
      ? isSpeaking
        ? "speaking"
        : "listening"
      : "idle";

  const statusLabel = connecting
    ? "Connecting…"
    : connected
      ? isSpeaking
        ? "Concierge speaking"
        : isListening
          ? "Listening…"
          : "Connected"
      : "Tap to talk";

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-night-900 to-night-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-night-700/50 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              connected ? "bg-emerald-400" : connecting ? "bg-gold-400" : "bg-night-700"
            }`}
          />
          <h2 className="font-serif text-lg font-semibold text-mist-100">
            Aerial Concierge
          </h2>
        </div>
        <span className="rounded-full border border-night-700 bg-night-800 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-mist-300">
          Voice · RAG
        </span>
      </div>

      {/* Orb + status */}
      <div className="flex flex-col items-center pt-8">
        <Orb state={orbState} />
        <p className="mt-2 text-sm font-medium text-mist-200">{statusLabel}</p>
      </div>

      {/* Transcript */}
      <Transcript turns={turns} />

      {/* Errors / setup hints */}
      {micError && (
        <div className="mx-5 mb-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {micError}
        </div>
      )}
      {setup.phase === "unconfigured" && (
        <div className="mx-5 mb-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs text-gold-200">
          {setup.reason}
        </div>
      )}
      {setup.phase === "error" && (
        <div className="mx-5 mb-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {setup.reason}
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-night-700/50 px-5 py-4">
        {/* Volume + mute (only meaningful while connected) */}
        <div
          className={`mb-4 flex items-center gap-3 transition-opacity ${
            connected ? "opacity-100" : "pointer-events-none opacity-40"
          }`}
        >
          <button
            onClick={() => setMuted(!isMuted)}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            className={`rounded-full border p-2 transition-colors ${
              isMuted
                ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
                : "border-night-700 bg-night-800 text-mist-200 hover:text-mist-100"
            }`}
          >
            <MicIcon muted={isMuted} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolumeState(Number(e.target.value))}
            aria-label="Concierge volume"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-night-700 accent-gold-500"
          />
          <span className="w-9 text-right text-xs tabular-nums text-mist-300">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Start / stop */}
        {connected || connecting ? (
          <button
            onClick={handleStop}
            className="w-full rounded-xl border border-rose-500/50 bg-rose-500/10 py-3 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
          >
            End conversation
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={setup.phase !== "ready"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-3 text-sm font-semibold text-night-950 transition-all hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MicIcon muted={false} />
            {setup.phase === "loading" ? "Preparing…" : "Talk to the concierge"}
          </button>
        )}

        <p className="mt-3 text-center text-[10px] leading-relaxed text-mist-300">
          Grounded on Aerial's knowledge base via ElevenLabs RAG. Powered by
          ElevenLabs Agents.
        </p>
      </div>
    </div>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 11a7 7 0 01-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {muted && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
