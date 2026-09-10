/**
 * ------------------------------------------------------------
 * Metrics Registry
 * ------------------------------------------------------------
 *
 * A minimal in-memory registry rendered in Prometheus text
 * exposition format at GET /metrics. Hand-rolled rather than
 * pulling in a client library — the format itself is a handful
 * of "name{labels} value" lines, well within what this project
 * needs (per-backend counters, a gauge, and a duration histogram).
 */

const HISTOGRAM_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

const requestsTotal = new Map();
const errorsTotal = new Map();
const backendHealthy = new Map();
const durationBuckets = new Map();
const durationSum = new Map();
const durationCount = new Map();

function inc(map, key, by = 1) {
    map.set(key, (map.get(key) || 0) + by);
}

function recordRequest(backendId, durationMs) {
    inc(requestsTotal, backendId);
    inc(durationSum, backendId, durationMs);
    inc(durationCount, backendId);

    if (!durationBuckets.has(backendId)) {
        durationBuckets.set(backendId, new Map());
    }

    const buckets = durationBuckets.get(backendId);

    for (const bucket of HISTOGRAM_BUCKETS_MS) {
        if (durationMs <= bucket) {
            inc(buckets, bucket);
        }
    }

    inc(buckets, "+Inf");
}

function recordError(backendId) {
    inc(errorsTotal, backendId);
}

function setBackendHealth(backendId, healthy) {
    backendHealthy.set(backendId, healthy ? 1 : 0);
}

function removeBackend(backendId) {
    requestsTotal.delete(backendId);
    errorsTotal.delete(backendId);
    backendHealthy.delete(backendId);
    durationBuckets.delete(backendId);
    durationSum.delete(backendId);
    durationCount.delete(backendId);
}

function render() {
    const lines = [];

    lines.push("# HELP lb_requests_total Requests successfully proxied per backend.");
    lines.push("# TYPE lb_requests_total counter");
    for (const [id, count] of requestsTotal) {
        lines.push(`lb_requests_total{backend="${id}"} ${count}`);
    }

    lines.push("# HELP lb_request_errors_total Proxy errors per backend.");
    lines.push("# TYPE lb_request_errors_total counter");
    for (const [id, count] of errorsTotal) {
        lines.push(`lb_request_errors_total{backend="${id}"} ${count}`);
    }

    lines.push("# HELP lb_backend_healthy Backend health as seen by the health checker (1 = healthy).");
    lines.push("# TYPE lb_backend_healthy gauge");
    for (const [id, healthy] of backendHealthy) {
        lines.push(`lb_backend_healthy{backend="${id}"} ${healthy}`);
    }

    lines.push("# HELP lb_request_duration_ms Proxied request duration in milliseconds.");
    lines.push("# TYPE lb_request_duration_ms histogram");
    for (const [id, buckets] of durationBuckets) {
        for (const bucket of HISTOGRAM_BUCKETS_MS) {
            lines.push(`lb_request_duration_ms_bucket{backend="${id}",le="${bucket}"} ${buckets.get(bucket) || 0}`);
        }
        lines.push(`lb_request_duration_ms_bucket{backend="${id}",le="+Inf"} ${buckets.get("+Inf") || 0}`);
        lines.push(`lb_request_duration_ms_sum{backend="${id}"} ${durationSum.get(id) || 0}`);
        lines.push(`lb_request_duration_ms_count{backend="${id}"} ${durationCount.get(id) || 0}`);
    }

    return lines.join("\n") + "\n";
}

module.exports = {
    recordRequest,
    recordError,
    setBackendHealth,
    removeBackend,
    render
};
