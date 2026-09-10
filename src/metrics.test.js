const test = require("node:test");
const assert = require("node:assert");

const metrics = require("./metrics");

test("recordRequest increments count and cumulative histogram buckets", () => {
    metrics.recordRequest("m-backend-1", 30);

    const text = metrics.render();

    assert.match(text, /lb_requests_total\{backend="m-backend-1"\} 1/);
    // 30ms falls in buckets >= 50 (cumulative), not in the 5/10/25 buckets
    assert.match(text, /lb_request_duration_ms_bucket\{backend="m-backend-1",le="50"\} 1/);
    assert.match(text, /lb_request_duration_ms_bucket\{backend="m-backend-1",le="25"\} 0/);
    assert.match(text, /lb_request_duration_ms_bucket\{backend="m-backend-1",le="\+Inf"\} 1/);
    assert.match(text, /lb_request_duration_ms_sum\{backend="m-backend-1"\} 30/);

    metrics.removeBackend("m-backend-1");
});

test("recordError increments the error counter independently of requests", () => {
    metrics.recordError("m-backend-2");
    metrics.recordError("m-backend-2");

    const text = metrics.render();

    assert.match(text, /lb_request_errors_total\{backend="m-backend-2"\} 2/);

    metrics.removeBackend("m-backend-2");
});

test("setBackendHealth reflects current state as a gauge", () => {
    metrics.setBackendHealth("m-backend-3", true);
    assert.match(metrics.render(), /lb_backend_healthy\{backend="m-backend-3"\} 1/);

    metrics.setBackendHealth("m-backend-3", false);
    assert.match(metrics.render(), /lb_backend_healthy\{backend="m-backend-3"\} 0/);

    metrics.removeBackend("m-backend-3");
});

test("removeBackend clears all series for that backend", () => {
    metrics.recordRequest("m-backend-4", 10);
    metrics.setBackendHealth("m-backend-4", true);

    metrics.removeBackend("m-backend-4");

    const text = metrics.render();
    assert.doesNotMatch(text, /"m-backend-4"/);
});
