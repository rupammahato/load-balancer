const STATUS_STYLES = {
  connected: "bg-green-500/20 text-green-400 border-green-500/30",
  connecting: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_LABEL = {
  connected: "Live",
  connecting: "Connecting…",
  error: "Disconnected",
};

function Navbar({ status = "connecting" }) {
  return (
    <header
      className="
                flex
                items-center
                justify-between
                mb-6
            "
    >
      <div>
        <h1 className="text-3xl font-bold">Consistent Hashing Simulator</h1>

        <p className="text-slate-400 mt-1">
          Interactive Load Balancer Visualization
        </p>
      </div>

      <div
        className={`
                    rounded-full
                    px-4
                    py-2
                    text-sm
                    border
                    ${STATUS_STYLES[status]}
                `}
      >
        ● {STATUS_LABEL[status]}
      </div>
    </header>
  );
}

export default Navbar;
