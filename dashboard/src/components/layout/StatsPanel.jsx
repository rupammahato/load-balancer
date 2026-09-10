import Panel from "../common/Panel";

function StatsPanel({ healthyBackends = 0, virtualNodes = 0, keys = 0, movedKeys = 0, reqPerSec = 0 }) {
  const stats = [
    ["Healthy Backends", healthyBackends],
    ["Virtual Nodes", virtualNodes],
    ["Live Req/s", reqPerSec],
    ["Keys", keys],
    ["Moved Keys", movedKeys],
  ];

  return (
    <Panel title="Statistics" className="h-full">
      <div className="divide-y divide-console-line">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-console-ink-faint">{label}</p>
            <p className="font-mono text-2xl font-medium tabular-nums text-console-ink">{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default StatsPanel;
