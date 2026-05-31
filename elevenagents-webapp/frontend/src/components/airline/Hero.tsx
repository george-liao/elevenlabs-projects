export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Layered gradient "sky at altitude" backdrop. */}
      <div className="absolute inset-0 bg-gradient-to-b from-night-900 via-night-950 to-night-950" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="absolute -left-20 top-40 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative px-6 py-20 lg:px-10 lg:py-28">
        <p className="mb-5 animate-fade-up text-xs font-semibold uppercase tracking-[0.35em] text-gold-400">
          Headquartered in Singapore
        </p>
        <h1
          className="max-w-2xl animate-fade-up font-serif text-5xl font-semibold leading-[1.05] text-mist-100 lg:text-7xl"
          style={{ animationDelay: "0.05s" }}
        >
          The world,
          <br />
          <span className="text-gold-gradient">at altitude.</span>
        </h1>
        <p
          className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-mist-300"
          style={{ animationDelay: "0.12s" }}
        >
          Premium international travel for those who measure a journey by how it
          feels. Private suites, flat-bed cabins, and a concierge who knows your
          name — from Changi to the world.
        </p>

        <div
          className="mt-9 flex animate-fade-up flex-wrap items-center gap-4"
          style={{ animationDelay: "0.2s" }}
        >
          <button className="rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-night-950 transition-all hover:bg-gold-400 hover:shadow-xl hover:shadow-gold-500/25">
            Explore destinations
          </button>
          <button className="group flex items-center gap-2 text-sm font-medium text-mist-200 transition-colors hover:text-gold-300">
            Discover Aerial Suites
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        <dl
          className="mt-16 grid max-w-xl animate-fade-up grid-cols-3 gap-8 border-t border-night-700/60 pt-8"
          style={{ animationDelay: "0.28s" }}
        >
          {[
            { v: "68", l: "Destinations" },
            { v: "4.9★", l: "Premium rating" },
            { v: "24/7", l: "Voice concierge" },
          ].map((s) => (
            <div key={s.l}>
              <dt className="font-serif text-3xl font-semibold text-gold-300">
                {s.v}
              </dt>
              <dd className="mt-1 text-xs uppercase tracking-wider text-mist-300">
                {s.l}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
