export function polarToCartesian(cx, cy, radius, angleDegrees) {

    const radians = (angleDegrees - 90) * Math.PI / 180;

    return {

        x: cx + radius * Math.cos(radians),

        y: cy + radius * Math.sin(radians)

    };

}

// The ring's hash space is a 32-bit unsigned int (crypto.createHash
// digest read as UInt32BE in src/ring.js) — map it onto 0-360deg.
const MAX_HASH = 0xffffffff;

export function hashToAngle(hash) {
    return (hash / MAX_HASH) * 360;
}

function angularDistance(a, b) {
    const diff = Math.abs(a - b) % 360;
    return Math.min(diff, 360 - diff);
}

/**
 * Pick one label position per backend from its own vnodes, greedily
 * maximizing separation from already-placed labels.
 *
 * A backend's vnode hashes are a real, evenly-spread population (150
 * by default) — using one fixed index (e.g. vnode #0) as "the" label
 * position isn't safe: hashFn is deterministic, so two backend ids
 * can land their #0 vnode a fraction of a degree apart and one label
 * permanently hides behind the other. Picking the best-separated of a
 * backend's own ~150 candidates avoids that while still using real
 * hash data, not an arbitrary offset.
 */
export function pickLabelAngles(vnodes, backendIds) {
    const anglesByBackend = new Map(backendIds.map(id => [id, []]));

    for (const vnode of vnodes) {
        anglesByBackend.get(vnode.nodeId)?.push(hashToAngle(vnode.hash));
    }

    const placed = [];
    const result = new Map();

    for (const id of backendIds) {
        const candidates = anglesByBackend.get(id);

        if (!candidates || candidates.length === 0) {
            continue;
        }

        let best = candidates[0];

        if (placed.length > 0) {
            let bestScore = -1;

            for (const angle of candidates) {
                const score = Math.min(...placed.map(p => angularDistance(angle, p)));

                if (score > bestScore) {
                    bestScore = score;
                    best = angle;
                }
            }
        }

        result.set(id, best);
        placed.push(best);
    }

    return result;
}
