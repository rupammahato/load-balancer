/**
 * ------------------------------------------------------------
 * Central Configuration
 * ------------------------------------------------------------
 *
 * This module contains every configurable value used by the
 * load balancer.
 *
 * Environment variables override defaults where applicable.
 */

function parseBackendsEnv() {
    if (!process.env.BACKENDS_JSON) {
        return null;
    }

    try {
        return JSON.parse(process.env.BACKENDS_JSON);
    } catch (err) {
        console.error(`[config] BACKENDS_JSON is not valid JSON: ${err.message}`);
        process.exit(1);
    }
}

/**
 * Alternative to BACKENDS_JSON for platforms that can only wire one
 * value per env var (e.g. Render's Blueprint `fromService` reference
 * gives one "host:port" string per service, not a composable JSON
 * blob). BACKEND_1, BACKEND_2, ... each "host:port" -> backend-N.
 */
function parseNumberedBackendsEnv() {
    const backends = [];

    for (let i = 1; process.env[`BACKEND_${i}`]; i++) {
        const [host, port] = process.env[`BACKEND_${i}`].split(":");
        backends.push({ id: `backend-${i}`, host, port: Number(port) });
    }

    return backends.length > 0 ? backends : null;
}

const DEFAULT_BACKENDS = [
    {
        id: "backend-1",
        host: "localhost",
        port: 4001
    },
    {
        id: "backend-2",
        host: "localhost",
        port: 4002
    },
    {
        id: "backend-3",
        host: "localhost",
        port: 4003
    }
];

const config = {
    /**
     * Backend servers participating in the hash ring.
     *
     * Override with BACKENDS_JSON (e.g. for Docker Compose, where
     * each backend is its own container reachable by service name,
     * not "localhost") — a JSON array of {id, host, port, weight?}.
     * Or with BACKEND_1/BACKEND_2/... ("host:port" each) for platforms
     * like Render that can only give one value per env var.
     */
    backends: parseBackendsEnv() ?? parseNumberedBackendsEnv() ?? DEFAULT_BACKENDS,

    /**
     * Number of virtual nodes per backend.
     */
    vnodeCount: Number(process.env.VNODE_COUNT) || 150,

    /**
     * Health checking configuration.
     */
    healthCheckIntervalMs:
        Number(process.env.HEALTH_INTERVAL_MS) || 5000,

    healthCheckFailureThreshold:
        Number(process.env.HEALTH_FAILURE_THRESHOLD) || 3,

    healthCheckPath:
        process.env.HEALTH_PATH || "/health",

    /**
     * Routing strategy.
     *
     * Supported values:
     *
     *  - ip
     *  - path
     *  - header
     */
    routingKeyStrategy:
        process.env.ROUTING_KEY_STRATEGY || "header",

    /**
     * Header used when routing strategy = "header"
     */
    routingHeaderName:
        process.env.ROUTING_HEADER_NAME || "x-client-id",

    /**
     * Load balancer port. LB_PORT takes priority; PORT is the
     * fallback since that's the convention most hosting platforms
     * (Render, Heroku, ...) inject automatically.
     */
    lbPort:
        Number(process.env.LB_PORT) || Number(process.env.PORT) || 8080,

    /**
     * TLS termination. Off by default — set both env vars to enable.
     * See scripts/generate-dev-cert.sh for a local self-signed cert.
     */
    tlsCertPath: process.env.TLS_CERT_PATH || null,
    tlsKeyPath: process.env.TLS_KEY_PATH || null
};

module.exports = config;