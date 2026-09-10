const test = require("node:test");
const assert = require("node:assert");

const logger = require("./logger");

function captureLog(fn) {
    const original = console.log;
    let captured;
    console.log = (line) => { captured = line; };
    try {
        fn();
    } finally {
        console.log = original;
    }
    return JSON.parse(captured);
}

test("log line has level and message fields", () => {
    const entry = captureLog(() => logger.info("backend recovered", { backendId: "b1" }));
    assert.strictEqual(entry.level, "info");
    assert.strictEqual(entry.message, "backend recovered");
    assert.strictEqual(entry.backendId, "b1");
    assert.ok(entry.time);
});

test("a meta field named 'message' cannot shadow the real message", () => {
    const entry = captureLog(() => logger.error("proxy error", { message: "should not win" }));
    assert.strictEqual(entry.message, "proxy error");
});
