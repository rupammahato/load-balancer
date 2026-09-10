import Panel from "../common/Panel";

const LEVEL_STYLES = {
  info: "text-console-ink-muted",
  warn: "text-console-warn",
  error: "text-console-bad",
};

function EventLog({ events = [] }) {
  return (
    <Panel title="Event Log" className="h-72 flex flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4 font-mono text-xs">
        {events.length === 0 && (
          <div className="text-console-ink-faint">Nothing yet — try Generate Keys or Add Backend.</div>
        )}

        {events.map((event) => (
          <div key={event.id} className={LEVEL_STYLES[event.level] ?? LEVEL_STYLES.info}>
            <span className="text-console-ink-faint">{event.time}</span> {event.text}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default EventLog;
