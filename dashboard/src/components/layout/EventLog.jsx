import GlassCard from "../common/GlassCard";

const LEVEL_STYLES = {
  info: "text-slate-300",
  warn: "text-amber-400",
  error: "text-red-400",
};

function EventLog({ events = [] }) {
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-semibold mb-4">Event Timeline</h2>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {events.length === 0 && (
          <div className="text-slate-500">Nothing yet — try Generate Keys or Add Backend.</div>
        )}

        {events.map((event) => (
          <div key={event.id} className={LEVEL_STYLES[event.level] ?? LEVEL_STYLES.info}>
            ● <span className="text-slate-500 font-mono text-xs">{event.time}</span> {event.text}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default EventLog;
