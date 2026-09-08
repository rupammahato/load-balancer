import { Play } from "lucide-react";

function LandingPage({ onStart }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <section className=" w-full">
        <div
          className="
                        rounded-3xl
                        border
                        border-slate-800
                        bg-slate-900/60
                        backdrop-blur-xl
                        shadow-2xl
                        px-16
                        py-20
                        text-center
                    "
        >
          <div
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-full
                            border
                            border-cyan-500/30
                            bg-cyan-500/10
                            px-4
                            py-2
                            text-sm
                            text-cyan-300
                            mb-8
                        "
          >
            ● Interactive Systems Visualization
          </div>

          <h1
            className="
                            text-6xl
                            font-black
                            tracking-tight
                            leading-tight
                        "
          >
            Consistent Hashing
            <span className="block text-cyan-400">Simulator</span>
          </h1>

          <p
            className="
                            mt-8
                            text-lg
                            text-slate-400
                            max-w-3xl
                            mx-auto
                            leading-8
                        "
          >
            Learn how modern distributed systems route requests using consistent
            hashing, virtual nodes and automatic failover through an interactive
            visualization.
          </p>

          <div
            className="
                            mt-14
                            flex
                            justify-center
                        "
          >
            <button
              onClick={onStart}
              className="
        flex
        items-center
        gap-3
        rounded-xl
        bg-cyan-500
        px-8
        py-4
        text-lg
        font-semibold
        transition
        hover:scale-105
        hover:bg-cyan-400
    "
            >
              <Play size={20} />
              Start Simulation
            </button>
          </div>

          <div
            className="
                            mt-16

                            grid

                            grid-cols-3

                            gap-6
                        "
          >
            <FeatureCard
              title="Learn"
              desc="Understand consistent hashing visually."
            />

            <FeatureCard
              title="Simulate"
              desc="Add and remove backends in real time."
            />

            <FeatureCard
              title="Benchmark"
              desc="Observe distribution and failover."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div
      className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/60
                p-6
            "
    >
      <h3 className="font-bold text-xl">{title}</h3>

      <p
        className="
                    mt-3
                    text-slate-400
                    leading-7
                "
      >
        {desc}
      </p>
    </div>
  );
}

export default LandingPage;
