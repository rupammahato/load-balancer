function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`
                rounded-2xl
                border
                border-slate-800
                bg-slate-900/60
                backdrop-blur-xl
                shadow-xl
                ${className}
            `}
    >
      {children}
    </div>
  );
}

export default GlassCard;
