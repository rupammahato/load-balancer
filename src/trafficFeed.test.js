const test = require("node:test");
const assert = require("node:assert");

const trafficFeed = require("./trafficFeed");

test("subscribers receive published events", () => {
    const received = [];
    const unsubscribe = trafficFeed.subscribe(event => received.push(event));

    trafficFeed.publish({ backendId: "backend-1", statusCode: 200 });

    assert.strictEqual(received.length, 1);
    assert.strictEqual(received[0].backendId, "backend-1");

    unsubscribe();
});

test("unsubscribe stops further delivery", () => {
    const received = [];
    const unsubscribe = trafficFeed.subscribe(event => received.push(event));

    unsubscribe();
    trafficFeed.publish({ backendId: "backend-2" });

    assert.strictEqual(received.length, 0);
});

test("multiple subscribers each receive the same event", () => {
    const a = [];
    const b = [];
    const unsubA = trafficFeed.subscribe(e => a.push(e));
    const unsubB = trafficFeed.subscribe(e => b.push(e));

    trafficFeed.publish({ backendId: "backend-3" });

    assert.strictEqual(a.length, 1);
    assert.strictEqual(b.length, 1);

    unsubA();
    unsubB();
});
