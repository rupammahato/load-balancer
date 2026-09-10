import { motion } from "framer-motion";
import { polarToCartesian, hashToAngle, pickLabelAngles } from "../../utils/geometry";
import { backendColor } from "../../utils/colors";

const CENTER = 300;
const RING_RADIUS = 210;

function RingCanvas({ vnodes = [], backends = [], keyRoutes = [], status = "connecting" }) {

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
                    stroke="#334155"
                    strokeWidth="3"
                />

                <circle cx={CENTER} cy={CENTER} r="5" fill="#38bdf8" />

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
                            opacity="0.55"
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
                                r="14"
                                fill={backendColor(backend.id)}
                                stroke="#030712"
                                strokeWidth="4"
                            />
                            <text
                                x={x}
                                y={y - 24}
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="13"
                            >
                                {backend.id}
                            </text>
                        </g>
                    );
                })}

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
                                opacity="0.35"
                            />
                            <rect
                                x={keyPos.x - 5}
                                y={keyPos.y - 5}
                                width="10"
                                height="10"
                                fill={color}
                                stroke="#030712"
                                strokeWidth="1.5"
                                transform={`rotate(45 ${keyPos.x} ${keyPos.y})`}
                            />
                        </motion.g>
                    );
                })}

            </svg>

            <Legend backends={backends} />
        </div>
    );

}

function Legend({ backends }) {
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-sm text-slate-300">
            {backends.map(backend => (
                <div key={backend.id} className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full inline-block"
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
            <p className="text-slate-300 text-lg">{text}</p>
            {sub && <p className="text-slate-500 text-sm font-mono">{sub}</p>}
        </div>
    );
}

export default RingCanvas;
