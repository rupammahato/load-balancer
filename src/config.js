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

const config = {
    /**
     * Backend servers participating in the hash ring.
     */
    backends: [
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
    ],

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
     * Load balancer port.
     */
    lbPort:
        Number(process.env.LB_PORT) || 8080
};

module.exports = config;