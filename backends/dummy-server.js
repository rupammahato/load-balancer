/**
 * ------------------------------------------------------------
 * Dummy Backend Server
 * ------------------------------------------------------------
 *
 * This is a lightweight backend server used to demonstrate the
 * load balancer.
 *
 * Multiple instances of this same file will run on different
 * ports (4001, 4002, 4003).
 *
 * Each instance identifies itself in every response so we can
 * verify which backend handled the request.
 */

const http = require("http");

const port = Number(process.argv[2]) || Number(process.env.PORT);

if (!port) {
    console.error(
        "Usage: node backends/dummy-server.js <port>"
    );
    process.exit(1);
}

const server = http.createServer((req, res) => {

    if (req.url === "/health") {

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify({
                status: "ok",
                backend: `backend-${port - 4000}`,
                port
            })
        );

        return;
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(
        JSON.stringify({
            message: "Request handled successfully.",
            backend: `backend-${port - 4000}`,
            port,
            method: req.method,
            path: req.url,
            timestamp: new Date().toISOString()
        })
    );

});

server.listen(port, () => {

    console.log(
        `[backend-${port - 4000}] Listening on http://localhost:${port}`
    );

});