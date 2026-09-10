import GlassCard from "../common/GlassCard";

function StatsPanel({ healthyBackends = 0, virtualNodes = 0, keys = 0, movedKeys = 0 }) {
  const stats = [
    ["Healthy Backends", healthyBackends],
    ["Virtual Nodes", virtualNodes],
    ["Keys", keys],
    ["Moved Keys", movedKeys],
  ];

  return (
    <GlassCard className="p-6 h-full">
      <h2 className="text-xl font-semibold mb-6">Statistics</h2>

      <div className="space-y-5">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-slate-400">{label}</p>

            <p className="text-3xl font-bold mt-1 font-mono tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default StatsPanel;
