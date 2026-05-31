const ROUTES = [
  {
    city: "London",
    code: "LHR",
    tag: "2× daily · non-stop",
    fare: "from S$4,820",
    hue: "from-rose-500/20 to-amber-500/10",
  },
  {
    city: "New York",
    code: "JFK",
    tag: "Ultra-long-haul · A350ULR",
    fare: "from S$6,150",
    hue: "from-sky-500/20 to-indigo-500/10",
  },
  {
    city: "Tokyo",
    code: "HND",
    tag: "3× daily · Suites",
    fare: "from S$2,390",
    hue: "from-fuchsia-500/20 to-rose-500/10",
  },
  {
    city: "Sydney",
    code: "SYD",
    tag: "2× daily · A380",
    fare: "from S$2,940",
    hue: "from-emerald-500/20 to-teal-500/10",
  },
];

export function RouteShowcase() {
  return (
    <section className="px-6 py-20 lg:px-10">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
            Flagship routes
          </p>
          <h2 className="font-serif text-4xl font-semibold text-mist-100">
            Where shall we take you?
          </h2>
        </div>
        <a
          href="#"
          className="hidden text-sm font-medium text-mist-300 transition-colors hover:text-gold-300 sm:block"
        >
          All 68 destinations →
        </a>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {ROUTES.map((r, i) => (
          <article
            key={r.code}
            className="group relative animate-fade-up overflow-hidden rounded-2xl border border-night-700/60 bg-night-800/60 p-6 transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-xl hover:shadow-black/40"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${r.hue} opacity-60 transition-opacity group-hover:opacity-100`}
            />
            <div className="relative">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-2xl font-semibold text-mist-100">
                  {r.city}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-mist-300">
                  {r.code}
                </span>
              </div>
              <p className="mt-1 text-xs text-mist-300">{r.tag}</p>
              <p className="mt-8 text-sm font-semibold text-gold-300">{r.fare}</p>
              <p className="text-[11px] text-mist-300">Business return, all-in</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
