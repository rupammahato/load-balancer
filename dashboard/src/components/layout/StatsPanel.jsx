import GlassCard from "../common/GlassCard";

const stats = [
  ["Healthy Backends", 3],
  ["Virtual Nodes", 450],
  ["Keys", 0],
  ["Moved Keys", 0],
];

function StatsPanel() {
  return (
    <GlassCard className="p-6 h-full">
      <h2 className="text-xl font-semibold mb-6">Statistics</h2>

      <div className="space-y-5">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-slate-400">{label}</p>

            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default StatsPanel;
