import { SiteHeader } from "./components/airline/SiteHeader";
import { Hero } from "./components/airline/Hero";
import { FlightSearch } from "./components/airline/FlightSearch";
import { RouteShowcase } from "./components/airline/RouteShowcase";
import { CabinShowcase } from "./components/airline/CabinShowcase";
import { ExperienceStrip } from "./components/airline/ExperienceStrip";
import { SiteFooter } from "./components/airline/SiteFooter";
import { VoiceAgentPanel } from "./components/voice/VoiceAgentPanel";

/**
 * App layout: a premium Singapore-headquartered airline marketing site on the
 * left (~2/3) and the embedded ElevenLabs voice concierge on the right (~1/3).
 *
 * On large screens the voice panel is sticky and full-height; on small screens
 * it stacks below the site content.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-night-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col lg:flex-row">
        {/* ── Airline site (≈2/3) ─────────────────────────────────────────── */}
        <main className="scroll-slim w-full lg:h-screen lg:w-2/3 lg:overflow-y-auto">
          <SiteHeader />
          <Hero />
          <FlightSearch />
          <RouteShowcase />
          <CabinShowcase />
          <ExperienceStrip />
          <SiteFooter />
        </main>

        {/* ── Voice concierge (≈1/3) ──────────────────────────────────────── */}
        <aside className="w-full border-t border-night-700/60 lg:h-screen lg:w-1/3 lg:border-l lg:border-t-0">
          <VoiceAgentPanel />
        </aside>
      </div>
    </div>
  );
}
