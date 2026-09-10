import { AnimatePresence, motion } from "framer-motion";
import { polarToCartesian, hashToAngle, pickLabelAngles } from "../../utils/geometry";
import { backendColor } from "../../utils/colors";

const CENTER = 300;
const RING_RADIUS = 210;

function RingCanvas({ vnodes = [], backends = [], keyRoutes = [], livePulses = [], status = "connecting" }) {

    if (status === "connecting") {
        return <CanvasMessage text="Connecting to load balancer…" />;
    }

    if (status === "error") {
        return (
            <CanvasMessage
                text="Can't reach the load balancer."
                sub="Start it with `npm start` from the project root."
            />
        );
    }

    if (backends.length === 0) {
        return <CanvasMessage text="No backends registered." />;
    }

    const labelAngleById = pickLabelAngles(vnodes, backends.map(b => b.id));

    return (
        <div className="w-full h-full flex flex-col items-center gap-4">
            <svg viewBox="0 0 600 600" className="w-full flex-1">

                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--color-console-line-strong)"
                    strokeWidth="2"
                />

                <circle cx={CENTER} cy={CENTER} r="4" fill="var(--color-console-accent)" />

                {vnodes.map((vnode, i) => {
                    const { x, y } = polarToCartesian(
                        CENTER, CENTER, RING_RADIUS, hashToAngle(vnode.hash)
                    );

                    return (
                        <circle
                            key={`${vnode.nodeId}-${vnode.hash}-${i}`}
                            cx={x}
                            cy={y}
                            r="2"
                            fill={backendColor(vnode.nodeId)}
                            opacity="0.5"
                        />
                    );
                })}

                {backends.map(backend => {
                    const angle = labelAngleById.get(backend.id);

                    if (angle === undefined) {
                        return null;
                    }

                    const { x, y } = polarToCartesian(CENTER, CENTER, RING_RADIUS, angle);

                    return (
                        <g key={backend.id}>
                            <circle
                                cx={x}
                                cy={y}
                                r="13"
                                fill={backendColor(backend.id)}
                                stroke="var(--color-console-bg)"
                                strokeWidth="4"
                            />
                            <text
                                x={x}
                                y={y - 22}
                                textAnchor="middle"
                                fill="var(--color-console-ink)"
                                fontFamily="var(--font-mono)"
                                fontSize="12"
                            >
                                {backend.id}
                            </text>
                        </g>
                    );
                })}

                {/* Simulated routing (Generate/Route Keys): persistent diamond + line */}
                {keyRoutes.map(route => {
                    const keyPos = polarToCartesian(
                        CENTER, CENTER, RING_RADIUS, hashToAngle(route.hash)
                    );

                    const targetAngle = labelAngleById.get(route.backend);
                    const targetPos = targetAngle === undefined
                        ? keyPos
                        : polarToCartesian(CENTER, CENTER, RING_RADIUS, targetAngle);

                    const color = backendColor(route.backend);

                    return (
                        <motion.g
                            key={route.key}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35 }}
                        >
                            <line
                                x1={keyPos.x}
                                y1={keyPos.y}
                                x2={targetPos.x}
                                y2={targetPos.y}
                                stroke={color}
                                strokeWidth="1"
                                opacity="0.3"
                            />
                            <rect
                                x={keyPos.x - 5}
                                y={keyPos.y - 5}
                                width="10"
                                height="10"
                                fill={color}
                                stroke="var(--color-console-bg)"
                                strokeWidth="1.5"
                                transform={`rotate(45 ${keyPos.x} ${keyPos.y})`}
                            />
                        </motion.g>
                    );
                })}

                {/* Real traffic: an ephemeral radar-style pulse per request, fades and expands */}
                <AnimatePresence>
                    {livePulses.map(pulse => {
                        const pos = polarToCartesian(
                            CENTER, CENTER, RING_RADIUS, hashToAngle(pulse.hash)
                        );
                        const color = pulse.backendId
                            ? backendColor(pulse.backendId)
                            : "var(--color-console-bad)";

                        return (
                            <motion.circle
                                key={pulse.id}
                                cx={pos.x}
                                cy={pos.y}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                initial={{ r: 3, opacity: 1 }}
                                animate={{ r: 18, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.1, ease: "easeOut" }}
                            />
                        );
                    })}
                </AnimatePresence>

            </svg>

            <Legend backends={backends} />
        </div>
    );

}

function Legend({ backends }) {
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center font-mono text-xs text-console-ink-muted">
            {backends.map(backend => (
                <div key={backend.id} className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: backendColor(backend.id) }}
                    />
                    {backend.id}
                    {backend.weight && backend.weight !== 1 ? ` (×${backend.weight})` : ""}
                </div>
            ))}
        </div>
    );
}

function CanvasMessage({ text, sub }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-2 px-8">
            <p className="text-console-ink-muted text-lg font-display">{text}</p>
            {sub && <p className="text-console-ink-faint text-sm font-mono">{sub}</p>}
        </div>
    );
}

export default RingCanvas;
