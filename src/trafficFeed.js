/**
 * ------------------------------------------------------------
 * Live Traffic Feed
 * ------------------------------------------------------------
 *
 * A tiny pub/sub for real proxied requests, consumed by the
 * dashboard's Server-Sent Events stream (GET /debug/traffic/stream).
 * Publishers (proxy.js) don't know or care whether anyone is
 * listening.
 */

const { EventEmitter } = require("events");

const emitter = new EventEmitter();
emitter.setMaxListeners(0); // unbounded SSE subscribers

function publish(event) {
    emitter.emit("event", event);
}

function subscribe(listener) {
    emitter.on("event", listener);
    return () => emitter.off("event", listener);
}

module.exports = { publish, subscribe };
