import Navbar from "../components/layout/Navbar";
import ControlPanel from "../components/layout/ControlPanel";
import StatsPanel from "../components/layout/StatsPanel";
import EventLog from "../components/layout/EventLog";
import GlassCard from "../components/common/GlassCard";
import RingCanvas from "../components/ring/RingCanvas";

function SimulatorPage() {
  return (
    <main className="min-h-screen p-8">
      <Navbar />

      <div
        className="
                    grid
                    grid-cols-12
                    gap-6
                "
      >
        <div className="col-span-2">
          <ControlPanel />
        </div>

        <div className="col-span-7">
          <GlassCard
            className="
                            h-full
                            flex
                            items-center
                            justify-center
                            min-h-[600px]
                        "
          >
            <RingCanvas />
          </GlassCard>
        </div>

        <div className="col-span-3">
          <StatsPanel />
        </div>
      </div>

      <div className="mt-6">
        <EventLog />
      </div>
    </main>
  );
}

export default SimulatorPage;
