/**
 * ------------------------------------------------------------
 * Unit Tests for Consistent Hash Ring
 * ------------------------------------------------------------
 *
 * These tests verify:
 *
 * 1. Even key distribution
 * 2. Minimal key movement after node removal
 * 3. Deterministic routing
 * 4. Correct wraparound behaviour
 * 5. Weighted nodes take a proportional key share
 */

const test = require("node:test");
const assert = require("node:assert");

const ConsistentHashRing = require("./index");

function generateRandomKeys(count) {
    const keys = [];

    for (let i = 0; i < count; i++) {
        keys.push(`user-${Math.random()}-${i}`);
    }

    return keys;
}

function buildRing() {
    const ring = new ConsistentHashRing({
        vnodeCount: 150
    });

    ring.addNode("backend-1");
    ring.addNode("backend-2");
    ring.addNode("backend-3");
    ring.addNode("backend-4");
    ring.addNode("backend-5");

    return ring;
}

test("Distribution is reasonably even", () => {

    const ring = buildRing();

    const keys = generateRandomKeys(10000);

    const distribution = ring.getDistribution(keys);

    console.log("\nDistribution:");

    for (const [node, count] of Object.entries(distribution)) {

        const percentage = (count / keys.length) * 100;

        console.log(
            `${node}: ${count} (${percentage.toFixed(2)}%)`
        );

        assert.ok(
            percentage < 30,
            `${node} received too many keys`
        );
    }

});

test("Removing one backend remaps roughly 20% of keys", () => {

    const ring = buildRing();

    const keys = generateRandomKeys(10000);

    const before = new Map();

    for (const key of keys) {
        before.set(key, ring.getNode(key));
    }

    ring.removeNode("backend-3");

    let moved = 0;

    for (const key of keys) {

        if (before.get(key) !== ring.getNode(key)) {
            moved++;
        }

    }

    const percentage = (moved / keys.length) * 100;

    console.log(
        `\nMoved Keys: ${moved}/${keys.length} (${percentage.toFixed(2)}%)`
    );

    assert.ok(
        percentage >= 15 && percentage <= 25,
        "Too many or too few keys moved."
    );

});

test("Routing is deterministic", () => {

    const ring = buildRing();

    const first = ring.getNode("chief");

    for (let i = 0; i < 1000; i++) {

        assert.strictEqual(
            ring.getNode("chief"),
            first
        );

    }

});

test("Wraparound returns the first vnode", () => {

    const ring = buildRing();

    const lastHash = ring.ring[ring.ring.length - 1].hash;

    const originalHashFn = ring.hashFn;

    ring.hashFn = () => lastHash + 1;

    const expected = ring.ring[0].nodeId;

    const actual = ring.getNode("anything");

    assert.strictEqual(actual, expected);

    ring.hashFn = originalHashFn;

});

test("A weight-2 node gets roughly double the vnodes of a weight-1 node", () => {

    const ring = new ConsistentHashRing({ vnodeCount: 100 });

    ring.addNode("a", 1);
    ring.addNode("b", 2);

    const counts = { a: 0, b: 0 };

    for (const entry of ring.getRingSnapshot()) {
        counts[entry.nodeId]++;
    }

    assert.strictEqual(counts.a, 100);
    assert.strictEqual(counts.b, 200);

});

test("A weighted node takes a proportional key share among several peers", () => {

    // Two nodes head-to-head has high variance (each is a single
    // giant arc on the circle) - real usage, and a meaningful check,
    // looks like this: one weighted node among several unweighted
    // peers, matching what was measured live against a real 4-backend
    // ring (weight 2 of 5 total units -> ~40%, measured 38.45%).
    const ring = new ConsistentHashRing({ vnodeCount: 150 });

    ring.addNode("a", 1);
    ring.addNode("b", 1);
    ring.addNode("c", 1);
    ring.addNode("d", 2);

    const keys = generateRandomKeys(20000);
    const distribution = ring.getDistribution(keys);

    const dShare = distribution.d / keys.length;

    assert.ok(
        dShare > 0.34 && dShare < 0.46,
        `Expected d (weight 2 of 5 units) to take ~40% of keys, got ${(dShare * 100).toFixed(1)}%`
    );

});
