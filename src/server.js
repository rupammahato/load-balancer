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
const {
    validateStartupBackends,
    createBackendRegistry
} = require("./backends");
const logger = require("./logger");
const metrics = require("./metrics");

// ------------------------------------------------------------
// Validate configuration before touching the ring
// ------------------------------------------------------------

try {
    validateStartupBackends(config.backends);
} catch (err) {
    console.error(`[config] ${err.message}`);
    process.exit(1);
}

// ------------------------------------------------------------
// Build the consistent hash ring
// ------------------------------------------------------------

const ring = new ConsistentHashRing({
    vnodeCount: config.vnodeCount
});

for (const backend of config.backends) {
    ring.addNode(backend.id, backend.weight ?? 1);
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
// Backend registry — backs both the startup list and the
// runtime admin API (POST/DELETE /backends)
// ------------------------------------------------------------

const registry = createBackendRegistry({
    ring,
    healthChecker,
    backends: config.backends
});

// ------------------------------------------------------------
// Create reverse proxy handler
// ------------------------------------------------------------

const proxyHandler = createProxyHandler({
    ring,
    backendMap: registry.backendMap,
    config
});

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";

        req.on("data", chunk => {
            data += chunk;

            if (data.length > 1e6) {
                reject(new Error("Request body too large."));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch (err) {
                reject(new Error("Invalid JSON body."));
            }
        });

        req.on("error", reject);
    });
}

function sendJson(res, statusCode, body) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body, null, 2));
}

async function requestHandler(req, res) {

    if (req.url === "/debug/ring") {

        const healthyBackends = ring.getUniqueNodes();

        sendJson(res, 200, {
            healthyBackends: healthyBackends.length,
            configuredBackends: registry.backendMap.size,
            virtualNodesPerBackend: config.vnodeCount,
            ringSize: ring.getRingSize(),
            routingStrategy: config.routingKeyStrategy,
            backends: [...registry.backendMap.values()],
            activeBackends: healthyBackends
        });

        return;
    }

    if (req.url === "/metrics") {

        const ringGauges = [
            "# HELP lb_ring_size Current number of virtual nodes in the hash ring.",
            "# TYPE lb_ring_size gauge",
            `lb_ring_size ${ring.getRingSize()}`,
            "# HELP lb_active_backends Number of backends currently in the ring.",
            "# TYPE lb_active_backends gauge",
            `lb_active_backends ${ring.getUniqueNodes().length}`
        ].join("\n") + "\n";

        res.writeHead(200, {
            "Content-Type": "text/plain; version=0.0.4; charset=utf-8"
        });
        res.end(metrics.render() + ringGauges);
        return;
    }

    // Runtime backend registration — no auth, matching the rest of
    // this project. Don't expose this port to untrusted networks.
    if (req.url === "/backends" && req.method === "POST") {

        let body;

        try {
            body = await readJsonBody(req);
        } catch (err) {
            sendJson(res, 400, { error: err.message });
            return;
        }

        const result = registry.register(body);

        if (!result.ok) {
            sendJson(res, 400, { errors: result.errors });
            return;
        }

        logger.info("backend registered", {
            backendId: result.backend.id,
            host: result.backend.host,
            port: result.backend.port,
            weight: result.backend.weight
        });
        sendJson(res, 201, result.backend);
        return;
    }

    if (req.url.startsWith("/backends/") && req.method === "DELETE") {

        const id = decodeURIComponent(req.url.slice("/backends/".length));
        const result = registry.unregister(id);

        if (!result.ok) {
            sendJson(res, 404, { errors: result.errors });
            return;
        }

        logger.info("backend removed", { backendId: id });
        sendJson(res, 200, { removed: id });
        return;
    }

    proxyHandler(req, res);

}

// ------------------------------------------------------------
// Create HTTP server
// ------------------------------------------------------------

const server = http.createServer(requestHandler);

server.listen(config.lbPort, () => {

    console.log("\n==========================================");
    console.log(" Consistent Hashing Load Balancer");
    console.log("==========================================");

    console.log(`Listening on port : ${config.lbPort}`);
    console.log(`Routing strategy  : ${config.routingKeyStrategy}`);
    console.log(`Virtual nodes     : ${config.vnodeCount}`);
    console.log(`Ring size         : ${ring.getRingSize()}`);

    if (config.routingKeyStrategy === "ip") {
        console.log(
            "\n[warning] routing strategy is \"ip\" — clients behind the " +
            "same NAT/CGNAT/corporate proxy will all hash to one backend."
        );
    }

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