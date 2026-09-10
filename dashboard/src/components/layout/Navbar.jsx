const STATUS_DOT = {
  connected: "bg-console-good",
  connecting: "bg-console-ink-faint",
  error: "bg-console-bad",
};

const STATUS_LABEL = {
  connected: "LIVE",
  connecting: "CONNECTING",
  error: "DISCONNECTED",
};

function Navbar({ status = "connecting" }) {
  return (
    <header className="mb-6 flex items-center justify-between border-b border-console-line pb-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-console-ink">
          Ring Console
        </h1>
        <p className="mt-1 text-sm text-console-ink-faint">
          Consistent hashing load balancer — live operations view
        </p>
      </div>

      <div className="flex items-center gap-2 border border-console-line px-3 py-1.5 font-mono text-xs tracking-wide text-console-ink-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
        {STATUS_LABEL[status]}
      </div>
    </header>
  );
}

export default Navbar;
