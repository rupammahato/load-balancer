/**
 * ------------------------------------------------------------
 * Load Balancer Server
 * ------------------------------------------------------------
 *
 * Application entry point.
 *
 * Responsibilities:
 *  - Load configuration
 *  - Build the consistent hash ring
 *  - Register all backends
 *  - Start health checks
 *  - Create reverse proxy
 *  - Start HTTP server
 *  - Gracefully shutdown
 */

const http = require("http");

const config = require("./config");
const ConsistentHashRing = require("./ring");
const { createProxyHandler } = require("./proxy");
const { startHealthChecks } = require("./healthcheck");

// ------------------------------------------------------------
// Build the consistent hash ring
// ------------------------------------------------------------

const ring = new ConsistentHashRing({
    vnodeCount: config.vnodeCount
});

for (const backend of config.backends) {
    ring.addNode(backend.id);
}

// ------------------------------------------------------------
// Start background health monitoring
// ------------------------------------------------------------

const healthChecker = startHealthChecks({
    ring,
    backends: config.backends,
    config
});

// ------------------------------------------------------------
// Create reverse proxy handler
// ------------------------------------------------------------

// const proxyHandler = createProxyHandler({
//     ring,
//     backends: config.backends,
//     config
// });

// ------------------------------------------------------------
// Build backend lookup map
// ------------------------------------------------------------

const backendMap = new Map();

for (const backend of config.backends) {
    backendMap.set(backend.id, backend);
}

// ------------------------------------------------------------
// Create reverse proxy handler
// ------------------------------------------------------------

const proxyHandler = createProxyHandler({
    ring,
    backendMap,
    config
});

function requestHandler(req, res) {

    if (req.url === "/debug/ring") {

        const healthyBackends = ring.getUniqueNodes();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({

            healthyBackends: healthyBackends.length,

            configuredBackends: config.backends.length,

            virtualNodesPerBackend: config.vnodeCount,

            ringSize: ring.getRingSize(),

            routingStrategy: config.routingKeyStrategy,

            backends: config.backends,

            activeBackends: healthyBackends

        }, null, 2));

        return;
    }

    proxyHandler(req, res);

}

// ------------------------------------------------------------
// Create HTTP server
// ------------------------------------------------------------

// const server = http.createServer(proxyHandler);
const server = http.createServer(requestHandler);

server.listen(config.lbPort, () => {

    console.log("\n==========================================");
    console.log(" Consistent Hashing Load Balancer");
    console.log("==========================================");

    console.log(`Listening on port : ${config.lbPort}`);
    console.log(`Routing strategy  : ${config.routingKeyStrategy}`);
    console.log(`Virtual nodes     : ${config.vnodeCount}`);
    console.log(`Ring size         : ${ring.getRingSize()}`);

    console.log("\nRegistered Backends:");

    for (const backend of config.backends) {
        console.log(
            `  • ${backend.id} -> http://${backend.host}:${backend.port}`
        );
    }

    console.log("\nLoad balancer is ready.\n");

});

// ------------------------------------------------------------
// Graceful shutdown
// ------------------------------------------------------------

function shutdown(signal) {

    console.log(`\nReceived ${signal}`);

    console.log("Stopping health checks...");

    healthChecker.stop();

    console.log("Closing HTTP server...");

    server.close(() => {

        console.log("Shutdown complete.");

        process.exit(0);

    });

}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));