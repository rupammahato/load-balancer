// The console's one structural primitive: a hairline-bordered panel
// with an optional titled header. `bracket` reserves the HUD
// corner-bracket treatment for one centerpiece panel (the ring) so it
// reads as a distinct instrument rather than decoration repeated on
// every box.
function Panel({ children, className = "", title, tag, bracket = false }) {
  return (
    <div
      className={`relative border border-console-line bg-console-surface/95 ${className}`}
    >
      {bracket && (
        <>
          <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-console-accent" />
          <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-console-accent" />
          <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-console-accent" />
          <span className="pointer-events-none absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-console-accent" />
        </>
      )}

      {title && (
        <div className="flex items-center justify-between border-b border-console-line px-4 py-2.5">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-console-ink-muted">
            {title}
          </h2>
          {tag}
        </div>
      )}

      {children}
    </div>
  );
}

export default Panel;
