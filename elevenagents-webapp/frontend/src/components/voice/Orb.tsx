type OrbState = "idle" | "connecting" | "listening" | "speaking";

/**
 * The animated concierge "orb". Visual state is driven by the conversation:
 * - idle:       calm, dim
 * - connecting: slow pulse
 * - listening:  cool blue glow with expanding rings (user is talking)
 * - speaking:   warm gold glow, gently breathing (agent is talking)
 */
export function Orb({ state }: { state: OrbState }) {
  const isActive = state === "listening" || state === "speaking";
  const tone =
    state === "speaking"
      ? "from-gold-300 to-gold-600"
      : state === "listening"
        ? "from-sky-300 to-indigo-500"
        : "from-night-700 to-night-800";

  const ringColor =
    state === "speaking"
      ? "border-gold-400/50"
      : state === "listening"
        ? "border-sky-400/50"
        : "border-night-700/40";

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      {/* Expanding rings while active */}
      {isActive && (
        <>
          <span
            className={`absolute h-32 w-32 rounded-full border ${ringColor} animate-pulse-ring`}
          />
          <span
            className={`absolute h-32 w-32 rounded-full border ${ringColor} animate-pulse-ring`}
            style={{ animationDelay: "0.6s" }}
          />
        </>
      )}

      {/* Soft outer glow */}
      <div
        className={`absolute h-36 w-36 rounded-full bg-gradient-to-br ${tone} opacity-25 blur-2xl transition-all duration-700 ${
          isActive ? "scale-110" : "scale-90"
        }`}
      />

      {/* Core sphere */}
      <div
        className={`relative h-28 w-28 rounded-full bg-gradient-to-br ${tone} shadow-2xl transition-all duration-500 ${
          state === "speaking" ? "animate-float" : ""
        } ${isActive ? "scale-105" : "scale-100"}`}
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/30 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      </div>
    </div>
  );
}
