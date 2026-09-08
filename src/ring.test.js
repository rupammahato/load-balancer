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
 */

const test = require("node:test");
const assert = require("node:assert");

const ConsistentHashRing = require("./ring");

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