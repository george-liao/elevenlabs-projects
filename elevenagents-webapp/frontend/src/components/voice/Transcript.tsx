import { useEffect, useRef } from "react";
import type { TranscriptTurn } from "./types";

export function Transcript({ turns }: { turns: TranscriptTurn[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest turn in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="max-w-xs text-sm leading-relaxed text-mist-300">
          Ask about routes, fares, cabins, baggage, lounges, or AerialClub. Try{" "}
          <span className="text-gold-300">
            “What's the best way to fly to London in a suite?”
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-slim flex-1 space-y-3 overflow-y-auto px-5 py-4">
      {turns.map((t) => (
        <div
          key={t.id}
          className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] animate-fade-up rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              t.role === "user"
                ? "rounded-br-sm bg-gold-500 text-night-950"
                : "rounded-bl-sm border border-night-700 bg-night-800 text-mist-100"
            }`}
          >
            {t.text}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
