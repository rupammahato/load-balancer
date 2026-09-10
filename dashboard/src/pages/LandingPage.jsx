import { Play } from "lucide-react";

function LandingPage({ onStart }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <section className="w-full max-w-4xl">
        <div className="relative border border-console-line bg-console-surface/95 px-14 py-16 text-center">
          <span className="pointer-events-none absolute -top-px -left-px h-4 w-4 border-t-2 border-l-2 border-console-accent" />
          <span className="pointer-events-none absolute -top-px -right-px h-4 w-4 border-t-2 border-r-2 border-console-accent" />
          <span className="pointer-events-none absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-console-accent" />
          <span className="pointer-events-none absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-console-accent" />

          <div className="inline-flex items-center gap-2 border border-console-line px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-console-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-console-good" />
            Live operations console
          </div>

          <h1 className="mt-8 font-display text-5xl font-semibold leading-tight tracking-wide text-console-ink">
            Ring Console
          </h1>

          <p className="mt-6 text-lg leading-8 text-console-ink-muted max-w-2xl mx-auto">
            Watch consistent hashing route real traffic — every vnode plotted at
            its true hash position, backends added and removed live, and every
            actual request the load balancer proxies traced onto the ring as it
            happens.
          </p>

          <div className="mt-12 flex justify-center">
            <button
              onClick={onStart}
              className="flex items-center gap-3 border border-console-accent bg-console-accent px-8 py-3.5 text-base font-semibold uppercase tracking-wide text-console-accent-ink transition hover:bg-console-accent/90"
            >
              <Play size={18} />
              Open Console
            </button>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-4 text-left">
            <FeatureCard
              title="Ring"
              desc="Every backend and virtual node plotted by real hash position, not a decorative shape."
            />
            <FeatureCard
              title="Live Traffic"
              desc="Real requests hitting the load balancer, streamed onto the ring and a live feed as they happen."
            />
            <FeatureCard
              title="Operate"
              desc="Add/remove backends and watch the failover, recovery, and key remapping unfold."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="border border-console-line bg-console-bg/40 p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-console-accent">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-console-ink-faint">{desc}</p>
    </div>
  );
}

export default LandingPage;
