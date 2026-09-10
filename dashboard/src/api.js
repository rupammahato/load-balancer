const BASE_URL = import.meta.env.VITE_LB_URL || "http://localhost:8080";

async function request(path, options) {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
        const message = (body.errors && body.errors.join(", ")) || body.error || `Request failed (${res.status})`;
        throw new Error(message);
    }

    return body;
}

export function getRing() {
    return request("/debug/ring");
}

export function routeKeys(keys) {
    return request(`/debug/route?keys=${encodeURIComponent(keys.join(","))}`);
}

export function addBackend(backend) {
    return request("/backends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backend)
    });
}

export function removeBackend(id) {
    return request(`/backends/${encodeURIComponent(id)}`, { method: "DELETE" });
}
