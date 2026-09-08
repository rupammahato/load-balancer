import GlassCard from "../common/GlassCard";

const logs = ["Simulator initialized.", "Ready to generate keys."];

function EventLog() {
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-semibold mb-4">Event Timeline</h2>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log} className="text-slate-300">
            ● {log}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default EventLog;
