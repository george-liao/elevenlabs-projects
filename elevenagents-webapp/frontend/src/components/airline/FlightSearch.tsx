import { useState } from "react";

const CITIES = [
  { code: "SIN", name: "Singapore" },
  { code: "LHR", name: "London Heathrow" },
  { code: "JFK", name: "New York JFK" },
  { code: "HND", name: "Tokyo Haneda" },
  { code: "SYD", name: "Sydney" },
  { code: "DXB", name: "Dubai" },
  { code: "HKG", name: "Hong Kong" },
  { code: "CDG", name: "Paris" },
  { code: "SFO", name: "San Francisco" },
];

const CABINS = ["Business", "First", "Aerial Suites"] as const;

export function FlightSearch() {
  const [trip, setTrip] = useState<"round" | "one">("round");
  const [from, setFrom] = useState("SIN");
  const [to, setTo] = useState("LHR");
  const [cabin, setCabin] = useState<(typeof CABINS)[number]>("Business");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const f = CITIES.find((c) => c.code === from)?.name ?? from;
    const t = CITIES.find((c) => c.code === to)?.name ?? to;
    setSubmitted(`${f} → ${t} · ${cabin}`);
  };

  return (
    <section className="relative z-20 px-6 lg:px-10">
      {/* Floating search card overlapping the hero. */}
      <form
        onSubmit={onSearch}
        className="-mt-8 rounded-2xl border border-night-700/60 bg-night-800/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl lg:p-6"
      >
        {/* Trip type toggle */}
        <div className="mb-5 inline-flex rounded-full border border-night-700 bg-night-900 p-1 text-xs font-medium">
          {(["round", "one"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrip(t)}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                trip === t
                  ? "bg-gold-500 text-night-950"
                  : "text-mist-300 hover:text-mist-100"
              }`}
            >
              {t === "round" ? "Round trip" : "One way"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_1fr_auto]">
          {/* From */}
          <Field label="From">
            <CitySelect value={from} onChange={setFrom} />
          </Field>

          {/* Swap */}
          <div className="hidden items-end justify-center pb-1 md:flex">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap origin and destination"
              className="rounded-full border border-night-700 bg-night-900 p-2.5 text-mist-300 transition-all hover:rotate-180 hover:border-gold-500 hover:text-gold-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* To */}
          <Field label="To">
            <CitySelect value={to} onChange={setTo} />
          </Field>

          {/* Cabin */}
          <Field label="Cabin">
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value as (typeof CABINS)[number])}
              className="w-full bg-transparent text-base font-medium text-mist-100 outline-none [&>option]:bg-night-800"
            >
              {CABINS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Submit */}
          <div className="flex items-end">
            <button
              type="submit"
              className="h-[52px] w-full rounded-xl bg-gold-500 px-7 text-sm font-semibold text-night-950 transition-all hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/25 md:w-auto"
            >
              Search
            </button>
          </div>
        </div>

        {submitted && (
          <p className="mt-4 animate-fade-up rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm text-gold-200">
            Showing premium fares for{" "}
            <span className="font-semibold">{submitted}</span>. Ask the concierge
            on the right for live availability and the best dates to fly.
          </p>
        )}
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-night-700 bg-night-900 px-4 py-2.5 transition-colors focus-within:border-gold-500">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-mist-300">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function CitySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-base font-medium text-mist-100 outline-none [&>option]:bg-night-800"
    >
      {CITIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} · {c.name}
        </option>
      ))}
    </select>
  );
}
