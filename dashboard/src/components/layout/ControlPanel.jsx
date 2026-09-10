import { useState } from "react";
import GlassCard from "../common/GlassCard";

const buttonClass = `
    w-full
    rounded-xl
    bg-slate-800
    py-3
    transition
    hover:enabled:bg-cyan-500
    disabled:opacity-40
    disabled:cursor-not-allowed
`;

const inputClass = "w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm";

function ControlPanel({
  backends = [],
  keysCount = 0,
  busy = false,
  onAddBackend,
  onRemoveBackend,
  onGenerateKeys,
  onRouteKeys,
  onReset,
}) {
  const [openForm, setOpenForm] = useState(null); // "add" | "remove" | null
  const [port, setPort] = useState("4004");
  const [weight, setWeight] = useState("1");
  const [removeId, setRemoveId] = useState(backends[0]?.id ?? "");

  function toggle(form) {
    setOpenForm(openForm === form ? null : form);
  }

  async function submitAdd(e) {
    e.preventDefault();
    await onAddBackend({ port: Number(port), weight: Number(weight) || 1 });
    setOpenForm(null);
  }

  async function submitRemove(e) {
    e.preventDefault();
    const id = removeId || backends[0]?.id;
    if (!id) return;
    await onRemoveBackend(id);
    setOpenForm(null);
  }

  return (
    <GlassCard className="p-6 h-full">
      <h2 className="text-xl font-semibold mb-6">Controls</h2>

      <div className="space-y-4">
        <button className={buttonClass} disabled={busy} onClick={() => toggle("add")}>
          Add Backend
        </button>

        {openForm === "add" && (
          <form onSubmit={submitAdd} className="space-y-2 rounded-lg bg-slate-950/60 p-3">
            <label className="block text-xs text-slate-400">
              Port (dummy backend must be running here)
              <input className={inputClass} value={port} onChange={e => setPort(e.target.value)} />
            </label>
            <label className="block text-xs text-slate-400">
              Weight
              <input className={inputClass} value={weight} onChange={e => setWeight(e.target.value)} />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-cyan-500 py-2 text-sm disabled:opacity-40">
              Register
            </button>
          </form>
        )}

        <button
          className={buttonClass}
          disabled={busy || backends.length === 0}
          onClick={() => toggle("remove")}
        >
          Remove Backend
        </button>

        {openForm === "remove" && (
          <form onSubmit={submitRemove} className="space-y-2 rounded-lg bg-slate-950/60 p-3">
            <select className={inputClass} value={removeId} onChange={e => setRemoveId(e.target.value)}>
              {backends.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
            </select>
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-red-500/80 py-2 text-sm disabled:opacity-40">
              Remove
            </button>
          </form>
        )}

        <button className={buttonClass} disabled={busy} onClick={onGenerateKeys}>
          Generate Keys
        </button>

        <button className={buttonClass} disabled={busy || keysCount === 0} onClick={onRouteKeys}>
          Route Keys
        </button>

        <button className={buttonClass} disabled={busy} onClick={onReset}>
          Reset
        </button>
      </div>
    </GlassCard>
  );
}

export default ControlPanel;
