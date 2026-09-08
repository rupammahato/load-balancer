/**
 * ------------------------------------------------------------
 * Reverse Proxy
 * ------------------------------------------------------------
 *
 * Receives incoming client requests, determines which backend
 * should handle them using the consistent hash ring, and
 * forwards the request using http-proxy.
 */

const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({
    changeOrigin: true
});

function getRoutingKey(req, config) {

    switch (config.routingKeyStrategy) {

        case "path":
            return req.url;

        case "header": {
            const header =
                req.headers[config.routingHeaderName.toLowerCase()];

            return header || req.socket.remoteAddress;
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

        try {

            const routingKey = getRoutingKey(req, config);

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

        proxy.web(req, res, {
            target: `http://${backend.host}:${backend.port}`
        });

    };

}

proxy.on("error", (err, req, res) => {

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