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
 *
 * Backends can also be registered or unregistered at runtime
 * (see addBackend/removeBackend) without restarting the process.
 */

function startHealthChecks({
    ring,
    backends,
    config
}) {

    const tracked = new Map();
    const failureCount = new Map();
    const healthy = new Map();

    for (const backend of backends) {
        tracked.set(backend.id, backend);
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

                ring.addNode(backend.id, backend.weight ?? 1);

                healthy.set(backend.id, true);
            }

        } catch (err) {

            const failures =
                (failureCount.get(backend.id) ?? 0) + 1;

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
            [...tracked.values()].map(checkBackend)
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
        },

        /**
         * Start tracking a backend registered at runtime.
         * It's assumed healthy immediately (same as startup),
         * and demoted like any other backend if checks fail.
         */
        addBackend(backend) {
            tracked.set(backend.id, backend);
            failureCount.set(backend.id, 0);
            healthy.set(backend.id, true);
        },

        removeBackend(id) {
            tracked.delete(id);
            failureCount.delete(id);
            healthy.delete(id);
        }

    };

}

module.exports = {
    startHealthChecks
};
