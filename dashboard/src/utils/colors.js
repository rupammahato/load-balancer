// Dataviz categorical palette (dark steps), validated against this
// dashboard's actual dark surface (#020617) — passes CVD separation,
// normal-vision floor, and contrast checks in this fixed order.
const CATEGORICAL = [
    "#3987e5", // blue
    "#d95926", // orange
    "#199e70", // aqua
    "#c98500", // yellow
    "#d55181", // magenta
    "#008300", // green
    "#9085e9", // violet
    "#e66767"  // red
];

// Color follows the entity, never its rank: once a backend gets a
// slot it keeps it, so removing/re-adding other backends never
// repaints survivors.
const assigned = new Map();
let nextIndex = 0;

export function backendColor(backendId) {
    if (!assigned.has(backendId)) {
        assigned.set(backendId, CATEGORICAL[nextIndex % CATEGORICAL.length]);
        nextIndex++;
    }

    return assigned.get(backendId);
}
