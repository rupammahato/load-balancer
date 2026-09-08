import GlassCard from "../common/GlassCard";

const buttons = [
  "Add Backend",
  "Remove Backend",
  "Generate Keys",
  "Route Keys",
  "Reset",
];

function ControlPanel() {
  return (
    <GlassCard className="p-6 h-full">
      <h2 className="text-xl font-semibold mb-6">Controls</h2>

      <div className="space-y-4">
        {buttons.map((button) => (
          <button
            key={button}
            className="
                            w-full
                            rounded-xl
                            bg-slate-800
                            py-3
                            transition
                            hover:bg-cyan-500
                        "
          >
            {button}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

export default ControlPanel;
