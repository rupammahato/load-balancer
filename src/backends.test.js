const test = require("node:test");
const assert = require("node:assert");

const {
    validateBackend,
    validateStartupBackends,
    createBackendRegistry
} = require("./backends");
const ConsistentHashRing = require("consistent-hash-ring");

function fakeHealthChecker() {
    const added = [];
    const removed = [];

    return {
        added,
        removed,
        addBackend(backend) {
            added.push(backend.id);
        },
        removeBackend(id) {
            removed.push(id);
        }
    };
}

test("validateBackend rejects missing fields", () => {
    const errors = validateBackend({}, new Set());
    assert.ok(errors.some(e => e.includes("id")));
    assert.ok(errors.some(e => e.includes("host")));
    assert.ok(errors.some(e => e.includes("port")));
});

test("validateBackend rejects duplicate id and out-of-range port", () => {
    const errors = validateBackend(
        { id: "b1", host: "localhost", port: 99999 },
        new Set(["b1"])
    );
    assert.ok(errors.some(e => e.includes("already registered")));
    assert.ok(errors.some(e => e.includes("port")));
});

test("validateBackend rejects non-positive weight", () => {
    const errors = validateBackend(
        { id: "b1", host: "localhost", port: 4001, weight: 0 },
        new Set()
    );
    assert.ok(errors.some(e => e.includes("weight")));
});

test("validateBackend accepts a well-formed backend", () => {
    const errors = validateBackend(
        { id: "b1", host: "localhost", port: 4001, weight: 2 },
        new Set()
    );
    assert.deepStrictEqual(errors, []);
});

test("validateStartupBackends throws on duplicate ids", () => {
    assert.throws(() => {
        validateStartupBackends([
            { id: "b1", host: "localhost", port: 4001 },
            { id: "b1", host: "localhost", port: 4002 }
        ]);
    }, /already registered/);
});

test("registry.register adds vnodes to the ring and tracks the backend", () => {
    const ring = new ConsistentHashRing({ vnodeCount: 100 });
    const healthChecker = fakeHealthChecker();
    const registry = createBackendRegistry({ ring, healthChecker, backends: [] });

    const result = registry.register({ id: "b1", host: "localhost", port: 4001 });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(ring.getRingSize(), 100);
    assert.strictEqual(registry.backendMap.get("b1").weight, 1);
    assert.deepStrictEqual(healthChecker.added, ["b1"]);
});

test("registry.register with weight 2 doubles the vnode count", () => {
    const ring = new ConsistentHashRing({ vnodeCount: 100 });
    const healthChecker = fakeHealthChecker();
    const registry = createBackendRegistry({ ring, healthChecker, backends: [] });

    registry.register({ id: "b1", host: "localhost", port: 4001, weight: 2 });

    assert.strictEqual(ring.getRingSize(), 200);
});

test("registry.register rejects a duplicate id without touching the ring", () => {
    const ring = new ConsistentHashRing({ vnodeCount: 100 });
    const healthChecker = fakeHealthChecker();
    const registry = createBackendRegistry({
        ring,
        healthChecker,
        backends: [{ id: "b1", host: "localhost", port: 4001 }]
    });
    ring.addNode("b1", 1);

    const result = registry.register({ id: "b1", host: "localhost", port: 4002 });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(ring.getRingSize(), 100);
});

test("registry.unregister removes vnodes and stops health tracking", () => {
    const ring = new ConsistentHashRing({ vnodeCount: 100 });
    const healthChecker = fakeHealthChecker();
    const registry = createBackendRegistry({ ring, healthChecker, backends: [] });
    registry.register({ id: "b1", host: "localhost", port: 4001 });

    const result = registry.unregister("b1");

    assert.strictEqual(result.ok, true);
    assert.strictEqual(ring.getRingSize(), 0);
    assert.deepStrictEqual(healthChecker.removed, ["b1"]);
});

test("registry.unregister on unknown id fails without side effects", () => {
    const ring = new ConsistentHashRing({ vnodeCount: 100 });
    const healthChecker = fakeHealthChecker();
    const registry = createBackendRegistry({ ring, healthChecker, backends: [] });

    const result = registry.unregister("nope");

    assert.strictEqual(result.ok, false);
});
