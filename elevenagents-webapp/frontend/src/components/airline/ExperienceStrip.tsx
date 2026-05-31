const ITEMS = [
  {
    title: "The Private Room",
    desc: "Changi's most exclusive lounge — à la carte dining and private shower suites for First & Suites guests.",
    icon: "M4 19h16M5 19V9l7-5 7 5v10M9 19v-5h6v5",
  },
  {
    title: "AerialClub",
    desc: "Earn up to 200% cabin bonus miles, guaranteed award seats, and a personal concierge line at Diamond.",
    icon: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z",
  },
  {
    title: "Door-to-door",
    desc: "Complimentary chauffeur transfers in 60+ cities, with baggage handled from your home to the cabin.",
    icon: "M3 13l2-5h11l3 5M5 13h14v4H5zM7 17a2 2 0 11-4 0M21 17a2 2 0 11-4 0",
  },
];

export function ExperienceStrip() {
  return (
    <section className="px-6 py-20 lg:px-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ITEMS.map((it, i) => (
          <div
            key={it.title}
            className="animate-fade-up rounded-2xl border border-night-700/60 bg-night-800/40 p-7"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d={it.icon}
                  stroke="#e7c574"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-serif text-xl font-semibold text-mist-100">
              {it.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
