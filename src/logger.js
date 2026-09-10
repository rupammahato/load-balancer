/**
 * ------------------------------------------------------------
 * Structured Logger
 * ------------------------------------------------------------
 *
 * One JSON line per event, for health transitions, proxy errors,
 * and admin actions — the events worth grepping/aggregating.
 * The human-readable startup banner in server.js stays plain
 * console.log; it's a one-time banner, not a log stream.
 */

function log(level, message, meta = {}) {
    // meta spread first so a caller-supplied field (e.g. accidentally
    // naming something "message") can never shadow these reserved keys.
    console.log(JSON.stringify({
        ...meta,
        time: new Date().toISOString(),
        level,
        message
    }));
}

module.exports = {
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta)
};
