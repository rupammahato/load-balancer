/**
 * ------------------------------------------------------------
 * Backend Registry
 * ------------------------------------------------------------
 *
 * Validates backend definitions and keeps the hash ring, the
 * backend lookup map, and the health checker in sync whenever
 * a backend is registered or removed — at startup or at runtime
 * via the admin API (POST/DELETE /backends).
 */

function validateBackend(backend, existingIds) {
    const errors = [];

    if (!backend || typeof backend !== "object") {
        return ["Backend must be an object."];
    }

    if (!backend.id || typeof backend.id !== "string") {
        errors.push("id is required and must be a string.");
    } else if (existingIds.has(backend.id)) {
        errors.push(`id "${backend.id}" is already registered.`);
    }

    if (!backend.host || typeof backend.host !== "string") {
        errors.push("host is required and must be a string.");
    }

    const port = Number(backend.port);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.push("port is required and must be an integer between 1 and 65535.");
    }

    if (backend.weight !== undefined) {
        const weight = Number(backend.weight);

        if (!Number.isFinite(weight) || weight <= 0) {
            errors.push("weight must be a positive number.");
        }
    }

    return errors;
}

/**
 * Validate the full startup backend list. Throws with a clear
 * message on the first invalid entry so misconfiguration fails
 * fast instead of silently misrouting traffic.
 */
function validateStartupBackends(backends) {
    const seen = new Set();

    for (const backend of backends) {
        const errors = validateBackend(backend, seen);

        if (errors.length > 0) {
            throw new Error(
                `Invalid backend config for "${backend && backend.id}": ${errors.join(" ")}`
            );
        }

        seen.add(backend.id);
    }
}

function createBackendRegistry({ ring, healthChecker, backends }) {
    const backendMap = new Map();

    for (const backend of backends) {
        backendMap.set(backend.id, backend);
    }

    function register(backend) {
        const errors = validateBackend(backend, new Set(backendMap.keys()));

        if (errors.length > 0) {
            return { ok: false, errors };
        }

        const normalized = {
            id: backend.id,
            host: backend.host,
            port: Number(backend.port),
            weight: backend.weight !== undefined ? Number(backend.weight) : 1
        };

        backendMap.set(normalized.id, normalized);
        ring.addNode(normalized.id, normalized.weight);
        healthChecker.addBackend(normalized);

        return { ok: true, backend: normalized };
    }

    function unregister(id) {
        if (!backendMap.has(id)) {
            return { ok: false, errors: [`id "${id}" is not registered.`] };
        }

        backendMap.delete(id);
        ring.removeNode(id);
        healthChecker.removeBackend(id);

        return { ok: true };
    }

    return { backendMap, register, unregister };
}

module.exports = {
    validateBackend,
    validateStartupBackends,
    createBackendRegistry
};
