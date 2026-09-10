import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import ControlPanel from "../components/layout/ControlPanel";
import StatsPanel from "../components/layout/StatsPanel";
import EventLog from "../components/layout/EventLog";
import GlassCard from "../components/common/GlassCard";
import RingCanvas from "../components/ring/RingCanvas";
import * as api from "../api";

const POLL_INTERVAL_MS = 2500;
const MAX_EVENTS = 30;
const KEYS_PER_BATCH = 24;

function timestamp() {
  return new Date().toLocaleTimeString();
}

function SimulatorPage() {
  const [status, setStatus] = useState("connecting");
  const [ring, setRing] = useState({ backends: [], vnodes: [], ringSize: 0 });
  const [keys, setKeys] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [movedKeys, setMovedKeys] = useState(0);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);

  const previousRouteByKey = useRef(new Map());
  // A ref, not state: refreshRing reads/writes it synchronously so two
  // overlapping polls (React StrictMode double-invokes effects in dev,
  // so two intervals briefly coexist) can't both see the pre-transition
  // status and each log a duplicate "connected"/"lost connection" event.
  const statusRef = useRef(status);

  const pushEvent = useCallback((text, level = "info") => {
    setEvents(prev => [{ id: `${Date.now()}-${Math.random()}`, text, level, time: timestamp() }, ...prev].slice(0, MAX_EVENTS));
  }, []);

  const refreshRing = useCallback(async () => {
    try {
      const data = await api.getRing();
      setRing(data);
      if (statusRef.current !== "connected") {
        pushEvent(`Connected — ${data.activeBackends.length} healthy backend(s).`);
      }
      statusRef.current = "connected";
      setStatus("connected");
    } catch (err) {
      if (statusRef.current !== "error") {
        pushEvent(`Lost connection to the load balancer: ${err.message}`, "error");
      }
      statusRef.current = "error";
      setStatus("error");
    }
  }, [pushEvent]);

  useEffect(() => {
    // refreshRing's setState calls are behind an `await`, not synchronous
    // in this tick, so this isn't the render-thrash pattern the rule
    // targets — it's a plain fetch-on-mount-then-poll loop. The rule's
    // own fix is a data-fetching library (React Query/SWR); adding one
    // for a single polling loop in a demo dashboard isn't worth it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshRing();
    const interval = setInterval(refreshRing, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshRing]);

  async function handleAddBackend({ port, weight }) {
    setBusy(true);
    try {
      const existingNums = ring.backends
        .map(b => Number(b.id.replace("backend-", "")))
        .filter(Number.isFinite);
      const nextId = `backend-${(existingNums.length ? Math.max(...existingNums) : 0) + 1}`;

      const backend = await api.addBackend({ id: nextId, host: "localhost", port, weight });
      pushEvent(`Registered ${backend.id} -> localhost:${backend.port} (weight ${backend.weight}).`);
      await refreshRing();
    } catch (err) {
      pushEvent(`Add backend failed: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveBackend(id) {
    setBusy(true);
    try {
      await api.removeBackend(id);
      pushEvent(`Removed ${id}.`, "warn");
      await refreshRing();
    } catch (err) {
      pushEvent(`Remove backend failed: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleGenerateKeys() {
    const generated = Array.from({ length: KEYS_PER_BATCH }, (_, i) =>
      `key-${i}-${Math.random().toString(36).slice(2, 8)}`
    );
    setKeys(generated);
    setRoutes([]);
    setMovedKeys(0);
    pushEvent(`Generated ${generated.length} keys.`);
  }

  async function handleRouteKeys() {
    setBusy(true);
    try {
      const { routes: routed } = await api.routeKeys(keys);

      let moved = 0;
      for (const route of routed) {
        const previous = previousRouteByKey.current.get(route.key);
        if (previous && previous !== route.backend) moved++;
      }

      previousRouteByKey.current = new Map(routed.map(r => [r.key, r.backend]));
      setRoutes(routed);
      setMovedKeys(moved);
      pushEvent(`Routed ${routed.length} keys — ${moved} moved since the last routing.`);
    } catch (err) {
      pushEvent(`Route keys failed: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setKeys([]);
    setRoutes([]);
    setMovedKeys(0);
    previousRouteByKey.current = new Map();
    setEvents([]);
    pushEvent("Simulator reset.");
  }

  return (
    <main className="min-h-screen p-8">
      <Navbar status={status} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-2">
          <ControlPanel
            backends={ring.backends}
            keysCount={keys.length}
            busy={busy}
            onAddBackend={handleAddBackend}
            onRemoveBackend={handleRemoveBackend}
            onGenerateKeys={handleGenerateKeys}
            onRouteKeys={handleRouteKeys}
            onReset={handleReset}
          />
        </div>

        <div className="col-span-7">
          <GlassCard className="h-full flex items-center justify-center min-h-[600px] p-6">
            <RingCanvas
              vnodes={ring.vnodes}
              backends={ring.backends}
              keyRoutes={routes}
              status={status}
            />
          </GlassCard>
        </div>

        <div className="col-span-3">
          <StatsPanel
            healthyBackends={ring.activeBackends?.length ?? 0}
            virtualNodes={ring.ringSize}
            keys={keys.length}
            movedKeys={movedKeys}
          />
        </div>
      </div>

      <div className="mt-6">
        <EventLog events={events} />
      </div>
    </main>
  );
}

export default SimulatorPage;
