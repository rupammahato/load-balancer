import { useState } from "react";
import Panel from "../common/Panel";

const buttonClass = `
    w-full border border-console-line py-2.5 font-mono text-xs uppercase tracking-wide
    text-console-ink-muted transition
    hover:enabled:border-console-accent hover:enabled:text-console-accent
    disabled:opacity-30 disabled:cursor-not-allowed
`;

const inputClass =
  "w-full border border-console-line bg-console-bg px-2.5 py-1.5 text-sm text-console-ink font-mono focus:border-console-accent focus:outline-none";

const labelClass = "block text-[11px] uppercase tracking-wide text-console-ink-faint";

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
    <Panel title="Controls" className="h-full">
      <div className="space-y-3 p-4">
        <button className={buttonClass} disabled={busy} onClick={() => toggle("add")}>
          + Add Backend
        </button>

        {openForm === "add" && (
          <form onSubmit={submitAdd} className="space-y-2 border border-console-line bg-console-bg/60 p-3">
            <label className={labelClass}>
              Port (dummy backend must be running here)
              <input className={`${inputClass} mt-1`} value={port} onChange={e => setPort(e.target.value)} />
            </label>
            <label className={labelClass}>
              Weight
              <input className={`${inputClass} mt-1`} value={weight} onChange={e => setWeight(e.target.value)} />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full border border-console-accent bg-console-accent/10 py-1.5 font-mono text-xs uppercase tracking-wide text-console-accent disabled:opacity-30"
            >
              Register
            </button>
          </form>
        )}

        <button
          className={buttonClass}
          disabled={busy || backends.length === 0}
          onClick={() => toggle("remove")}
        >
          − Remove Backend
        </button>

        {openForm === "remove" && (
          <form onSubmit={submitRemove} className="space-y-2 border border-console-line bg-console-bg/60 p-3">
            <select className={inputClass} value={removeId} onChange={e => setRemoveId(e.target.value)}>
              {backends.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="w-full border border-console-bad bg-console-bad/10 py-1.5 font-mono text-xs uppercase tracking-wide text-console-bad disabled:opacity-30"
            >
              Remove
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-console-line" />

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
    </Panel>
  );
}

export default ControlPanel;
