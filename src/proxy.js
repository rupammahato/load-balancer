/**
 * ------------------------------------------------------------
 * Reverse Proxy
 * ------------------------------------------------------------
 *
 * Receives incoming client requests, determines which backend
 * should handle them using the consistent hash ring, and
 * forwards the request using http-proxy.
 */

const http = require("http");
const httpProxy = require("http-proxy");

const logger = require("./logger");
const metrics = require("./metrics");
const trafficFeed = require("./trafficFeed");

// Reused across every proxied request so backend connections are
// pooled instead of opened and torn down per request. Without this,
// Node's default agent (keepAlive: false) makes every hop a fresh
// TCP handshake, which measured ~15x higher latency and a high
// connection-reset rate under concurrent load.
const keepAliveAgent = new http.Agent({ keepAlive: true });

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    agent: keepAliveAgent,
    proxyTimeout: 5000
});

let headerFallbackWarned = false;

function getRoutingKey(req, config) {

    switch (config.routingKeyStrategy) {

        case "path":
            return req.url;

        case "header": {
            const header =
                req.headers[config.routingHeaderName.toLowerCase()];

            if (!header) {
                if (!headerFallbackWarned) {
                    console.warn(
                        `[proxy] "${config.routingHeaderName}" header missing; ` +
                        "falling back to client IP for this and future requests " +
                        "without the header. Requests sharing an IP (NAT/proxy) " +
                        "will all route to the same backend."
                    );
                    headerFallbackWarned = true;
                }

                return req.socket.remoteAddress;
            }

            return header;
        }

        case "ip":
        default:
            return req.socket.remoteAddress;
    }

}

function createProxyHandler({
    ring,
    backendMap,
    config
}) {

    return (req, res) => {

        let backendId;
        let routingKey;

        try {

            routingKey = getRoutingKey(req, config);

            backendId = ring.getNode(routingKey);

        } catch (err) {

            res.writeHead(503, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "No healthy backend available."
            }));

            return;

        }

        const backend = backendMap.get(backendId);

        if (!backend) {

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Resolved backend does not exist."
            }));

            return;

        }

        res.setHeader(
            "X-Upstream-Backend",
            backend.id
        );

        // Stashed for the proxy's module-level "error" handler below,
        // which only receives (err, req, res) and otherwise has no
        // way to know which backend/key the failed request was for.
        req._lbBackendId = backend.id;
        req._lbRoutingKey = routingKey;
        req._lbRoutingHash = ring.hashFn(routingKey);

        const startedAt = process.hrtime.bigint();

        res.on("finish", () => {

            if (res._lbErrored) {
                return;
            }

            const durationMs =
                Number(process.hrtime.bigint() - startedAt) / 1e6;

            metrics.recordRequest(backend.id, durationMs);

            trafficFeed.publish({
                time: new Date().toISOString(),
                backendId: backend.id,
                routingKey,
                hash: req._lbRoutingHash,
                method: req.method,
                path: req.url,
                statusCode: res.statusCode,
                durationMs
            });

        });

        proxy.web(req, res, {
            target: `http://${backend.host}:${backend.port}`
        });

    };

}

proxy.on("error", (err, req, res) => {

    const backendId = req._lbBackendId;

    metrics.recordError(backendId);

    logger.error("proxy error", {
        backendId,
        errorCode: err.code,
        errorMessage: err.message
    });

    res._lbErrored = true;

    trafficFeed.publish({
        time: new Date().toISOString(),
        backendId,
        routingKey: req._lbRoutingKey,
        hash: req._lbRoutingHash,
        method: req.method,
        path: req.url,
        statusCode: 502,
        durationMs: null,
        error: err.code || err.message
    });

    if (!res.headersSent) {

        res.writeHead(502, {
            "Content-Type": "application/json"
        });

    }

    res.end(JSON.stringify({
        error: "Bad Gateway",
        message: err.message
    }));

});

module.exports = {
    createProxyHandler
};