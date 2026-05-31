import { Logo } from "./Logo";

const NAV = ["Book", "Destinations", "Cabins", "AerialClub", "Experience"];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-night-700/50 bg-night-950/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
        <Logo />

        <nav className="hidden items-center gap-7 text-sm font-medium text-mist-300 md:flex">
          {NAV.map((item) => (
            <a
              key={item}
              href="#"
              className="relative transition-colors hover:text-mist-100"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden text-sm font-medium text-mist-300 transition-colors hover:text-mist-100 sm:block">
            Sign in
          </button>
          <button className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-night-950 transition-all hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20">
            Join AerialClub
          </button>
        </div>
      </div>
    </header>
  );
}
