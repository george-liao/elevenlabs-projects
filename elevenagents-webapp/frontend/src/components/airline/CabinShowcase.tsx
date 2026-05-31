import { useState } from "react";

const CABINS = [
  {
    name: "Business",
    headline: "A private studio in the sky",
    desc: "Fully flat 1.9 m bed with direct-aisle access on every seat, an 18-inch HD screen, and dining on your schedule.",
    features: ["1.9 m flat bed", "Direct-aisle access", "On-demand dining", "Priority everything"],
  },
  {
    name: "First",
    headline: "Space that feels like arrival",
    desc: "A 2.1 m bed behind sliding privacy doors, caviar service, noise-cancelling headsets, and chauffeur transfers in 60+ cities.",
    features: ["2.1 m bed", "Sliding privacy doors", "Caviar service", "Chauffeur transfer"],
  },
  {
    name: "Aerial Suites",
    headline: "The suite that becomes a double bed",
    desc: "A private double-room suite with a separate bed and chair, a wardrobe, and a 32-inch screen — combine two for a true double bed.",
    features: ["Private suite", "Separate bed & chair", "32-inch screen", "Double-bed mode"],
  },
];

export function CabinShowcase() {
  const [active, setActive] = useState(0);
  const cabin = CABINS[active];

  return (
    <section className="border-y border-night-700/50 bg-night-900/40 px-6 py-20 lg:px-10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
        Cabins
      </p>
      <h2 className="mb-10 font-serif text-4xl font-semibold text-mist-100">
        Choose how you arrive
      </h2>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
        {/* Tabs */}
        <div className="flex shrink-0 flex-col gap-2 lg:w-56">
          {CABINS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setActive(i)}
              className={`rounded-xl border px-5 py-4 text-left transition-all ${
                active === i
                  ? "border-gold-500/60 bg-gold-500/10 text-mist-100"
                  : "border-night-700 bg-night-800/40 text-mist-300 hover:border-night-700 hover:text-mist-100"
              }`}
            >
              <span className="font-serif text-xl font-semibold">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Active cabin detail */}
        <div
          key={cabin.name}
          className="flex-1 animate-fade-up rounded-2xl border border-night-700/60 bg-gradient-to-br from-night-800 to-night-900 p-8 lg:p-10"
        >
          <h3 className="font-serif text-3xl font-semibold text-gold-gradient">
            {cabin.headline}
          </h3>
          <p className="mt-4 max-w-xl text-mist-300">{cabin.desc}</p>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cabin.features.map((f) => (
              <li
                key={f}
                className="rounded-xl border border-night-700/60 bg-night-950/40 px-4 py-3 text-sm text-mist-200"
              >
                {f}
              </li>
            ))}
          </ul>

          <button className="mt-8 rounded-full border border-gold-500/50 px-6 py-2.5 text-sm font-semibold text-gold-300 transition-all hover:bg-gold-500 hover:text-night-950">
            View {cabin.name} →
          </button>
        </div>
      </div>
    </section>
  );
}
