export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#0b1120" stroke="#1b2742" />
        <path d="M6 20.5 L26 11 L17.5 22 L15 17.5 Z" fill="#e7c574" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <span className="font-serif text-xl font-semibold tracking-wide text-mist-100">
            AERIAL
          </span>
          <span className="ml-1.5 text-[10px] font-medium uppercase tracking-[0.25em] text-gold-400">
            SG
          </span>
        </div>
      )}
    </div>
  );
}
