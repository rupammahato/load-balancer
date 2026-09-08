import { generateBackendNodes } from "../../utils/geometry";

const nodes = generateBackendNodes(3);

function RingCanvas() {
  return (
    <svg viewBox="0 0 600 600" className="w-full h-full">
      {/* Ring */}

      <circle
        cx="300"
        cy="300"
        r="210"
        fill="none"
        stroke="#334155"
        strokeWidth="3"
      />

      {/* Center */}

      <circle cx="300" cy="300" r="5" fill="#38bdf8" />

      {/* Backend Nodes */}

      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="14"
            fill="#22c55e"
            stroke="#030712"
            strokeWidth="4"
          />

          <text
            x={node.x}
            y={node.y - 24}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="13"
          >
            {node.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default RingCanvas;
