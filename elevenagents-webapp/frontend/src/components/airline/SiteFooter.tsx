import { Logo } from "./Logo";

const COLUMNS = [
  { title: "Fly", links: ["Book a flight", "Manage booking", "Flight status", "Destinations"] },
  { title: "Experience", links: ["Cabins", "Lounges", "Dining", "Chauffeur"] },
  { title: "AerialClub", links: ["Join", "Tiers & benefits", "Redeem miles", "Partners"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-night-700/50 bg-night-950 px-6 py-14 lg:px-10">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-300">
            Aerial Airlines Pte. Ltd. — Changi Airport, Singapore. Premium
            international travel, reimagined.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-mist-300 transition-colors hover:text-mist-100"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-night-700/50 pt-6 text-xs text-mist-300 sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} Aerial Airlines. A demo experience.</span>
        <span className="flex gap-5">
          <a href="#" className="hover:text-mist-100">Privacy</a>
          <a href="#" className="hover:text-mist-100">Terms</a>
          <a href="#" className="hover:text-mist-100">Contact</a>
        </span>
      </div>
    </footer>
  );
}
