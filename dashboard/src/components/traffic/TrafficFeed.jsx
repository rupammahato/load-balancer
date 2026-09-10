import { motion } from "framer-motion";
import Panel from "../common/Panel";
import { backendColor } from "../../utils/colors";

function formatTime(iso) {
  return new Date(iso).toTimeString().slice(0, 8);
}

function statusClass(code) {
  if (code === null || code === undefined) return "text-console-ink-faint";
  if (code < 300) return "text-console-good";
  if (code < 500) return "text-console-warn";
  return "text-console-bad";
}

function LiveDot({ active }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-console-good opacity-60" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${active ? "bg-console-good" : "bg-console-ink-faint"}`}
      />
    </span>
  );
}

function TrafficFeed({ events = [], reqPerSec = 0 }) {
  return (
    <Panel
      title="Live Traffic"
      className="flex h-72 flex-col"
      tag={
        <div className="flex items-center gap-2 font-mono text-[11px] text-console-ink-faint">
          <LiveDot active={reqPerSec > 0} />
          {reqPerSec} req/s
        </div>
      }
    >
      <div className="flex-1 space-y-1 overflow-y-auto p-4 font-mono text-xs">
        {events.length === 0 && (
          <div className="text-console-ink-faint">
            No real traffic yet — this is actual requests hitting the load balancer, not
            the simulated Generate/Route Keys demo. Try{" "}
            <code className="text-console-ink-muted">curl http://localhost:8080/</code> or{" "}
            <code className="text-console-ink-muted">npm run distribution</code>.
          </div>
        )}

        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <span className="w-[62px] shrink-0 text-console-ink-faint">{formatTime(event.time)}</span>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: event.backendId ? backendColor(event.backendId) : "var(--color-console-ink-faint)" }}
            />
            <span className="w-[76px] shrink-0 truncate text-console-ink-muted">{event.backendId ?? "—"}</span>
            <span className={`w-9 shrink-0 ${statusClass(event.statusCode)}`}>{event.statusCode ?? "ERR"}</span>
            <span className="flex-1 truncate text-console-ink-faint">{event.method} {event.path}</span>
            <span className="w-16 shrink-0 text-right text-console-ink-muted">
              {event.durationMs != null ? `${event.durationMs.toFixed(1)}ms` : event.error ?? "—"}
            </span>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

export default TrafficFeed;
