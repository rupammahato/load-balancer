const test = require("node:test");
const assert = require("node:assert");

// config.js reads process.env at require-time, so each test clears
// the module cache and sets env vars before requiring it fresh.
function loadConfigWith(env) {
    const saved = { ...process.env };

    for (const key of ["BACKENDS_JSON", "BACKEND_1", "BACKEND_2", "BACKEND_3", "LB_PORT", "PORT"]) {
        delete process.env[key];
    }

    Object.assign(process.env, env);
    delete require.cache[require.resolve("./config")];

    const config = require("./config");

    process.env = saved;
    delete require.cache[require.resolve("./config")];

    return config;
}

test("defaults to the 3 localhost backends when nothing is set", () => {
    const config = loadConfigWith({});
    assert.strictEqual(config.backends.length, 3);
    assert.strictEqual(config.backends[0].host, "localhost");
});

test("BACKENDS_JSON overrides the default backend list", () => {
    const config = loadConfigWith({
        BACKENDS_JSON: JSON.stringify([{ id: "x", host: "example.internal", port: 9001 }])
    });
    assert.deepStrictEqual(config.backends, [{ id: "x", host: "example.internal", port: 9001 }]);
});

test("BACKEND_1/BACKEND_2/... parses host:port pairs when BACKENDS_JSON is unset", () => {
    const config = loadConfigWith({
        BACKEND_1: "backend-1:10000",
        BACKEND_2: "backend-2:10001"
    });
    assert.deepStrictEqual(config.backends, [
        { id: "backend-1", host: "backend-1", port: 10000 },
        { id: "backend-2", host: "backend-2", port: 10001 }
    ]);
});

test("BACKENDS_JSON takes priority over BACKEND_1/BACKEND_2/...", () => {
    const config = loadConfigWith({
        BACKENDS_JSON: JSON.stringify([{ id: "x", host: "h", port: 1 }]),
        BACKEND_1: "backend-1:10000"
    });
    assert.strictEqual(config.backends.length, 1);
    assert.strictEqual(config.backends[0].id, "x");
});

test("lbPort falls back from LB_PORT to PORT to 8080", () => {
    assert.strictEqual(loadConfigWith({}).lbPort, 8080);
    assert.strictEqual(loadConfigWith({ PORT: "3000" }).lbPort, 3000);
    assert.strictEqual(loadConfigWith({ LB_PORT: "9000", PORT: "3000" }).lbPort, 9000);
});
