function Navbar() {
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
        className="
                    rounded-full
                    bg-green-500/20
                    text-green-400
                    px-4
                    py-2
                    text-sm
                    border
                    border-green-500/30
                "
      >
        ● Simulation Mode
      </div>
    </header>
  );
}

export default Navbar;
