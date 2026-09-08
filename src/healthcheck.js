/**
 * ------------------------------------------------------------
 * Health Checker
 * ------------------------------------------------------------
 *
 * Periodically checks every backend's /health endpoint.
 *
 * If a backend fails consecutive health checks, it is removed
 * from the consistent hash ring.
 *
 * When it recovers, it is automatically added back.
 */

function startHealthChecks({
    ring,
    backends,
    config
}) {

    const failureCount = new Map();
    const healthy = new Map();

    for (const backend of backends) {
        failureCount.set(backend.id, 0);
        healthy.set(backend.id, true);
    }

    async function checkBackend(backend) {

        const url =
            `http://${backend.host}:${backend.port}${config.healthCheckPath}`;

        try {

            const response = await fetch(url, {
                signal: AbortSignal.timeout(2000)
            });

            if (!response.ok) {
                throw new Error(
                    `Health endpoint returned ${response.status}`
                );
            }

            failureCount.set(backend.id, 0);

            if (!healthy.get(backend.id)) {

                console.log(
                    `[health] ${backend.id} recovered. Adding back to ring.`
                );

                ring.addNode(backend.id);

                healthy.set(backend.id, true);
            }

        } catch (err) {

            const failures =
                failureCount.get(backend.id) + 1;

            failureCount.set(backend.id, failures);

            if (
                healthy.get(backend.id) &&
                failures >= config.healthCheckFailureThreshold
            ) {

                console.log(
                    `[health] ${backend.id} marked DOWN after ${failures} consecutive failures.`
                );

                ring.removeNode(backend.id);

                healthy.set(backend.id, false);

            }

        }

    }

    async function checkAllBackends() {

        await Promise.all(
            backends.map(checkBackend)
        );

    }

    const interval = setInterval(
        checkAllBackends,
        config.healthCheckIntervalMs
    );

    // Perform the first check immediately
    checkAllBackends();

    return {

        stop() {
            clearInterval(interval);
        }

    };

}

module.exports = {
    startHealthChecks
};