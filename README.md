# Consistent Hashing Load Balancer

> A systems-level backend project implementing a **consistent hashing
> based HTTP load balancer** in Node.js using virtual nodes, automatic
> health checks, reverse proxying and deterministic request routing.

## Overview

This project demonstrates how modern distributed systems route requests
without causing massive remapping whenever backend servers are added or
removed.

Instead of using naïve modulo hashing (`hash(key) % N`), this project
implements **consistent hashing**, where both servers and request keys
are placed onto the same hash ring. Removing one backend only
redistributes approximately **1/N** of the keys rather than the entire
keyspace.

## Features

- Consistent Hash Ring
- Virtual Nodes (150 per backend by default, weighted per backend)
- Binary Search lookup (`O(log R)`)
- Deterministic routing
- Reverse proxy using `http-proxy` with a keep-alive agent
- Automatic health checking
- Automatic backend removal & recovery
- Runtime backend registration (`POST`/`DELETE /backends`) — no restart required
- Startup config validation (duplicate IDs, invalid host/port/weight)
- Configurable routing strategy
  - Client IP
  - URL Path
  - Custom Header
- Performance benchmark
- Distribution benchmark
- Debug endpoint (`/debug/ring`)
- Prometheus-format metrics (`/metrics`) — per-backend request/error counters, latency histogram, health gauge
- Structured (JSON) logs for health transitions and proxy errors
- Graceful shutdown

## Why Naïve Routing Fails

### Round Robin

Pros: - Even distribution

Cons: - No session affinity - Poor cache locality

### Modulo Hashing

```text
server = hash(key) % N
```

Changing the number of servers changes the modulus, causing almost every
key to move. This results in cache invalidation and expensive backend
reloads.

## Consistent Hashing

Servers and request keys are hashed onto the same circular hash space.

Routing algorithm:

1.  Hash the incoming key.
2.  Locate the first virtual node clockwise.
3.  Route the request to that backend.
4.  Wrap to the beginning if the key hash is greater than every vnode
    hash.

Expected remapping after removing one backend:

```text
≈ 1 / N
```

## Virtual Nodes

Each backend is represented by **150 virtual nodes**, improving load
distribution and reducing hotspot formation.

## Architecture

```text
               Client
                  |
                  v
      +-----------------------+
      |   Load Balancer       |
      |-----------------------|
      | Consistent Hash Ring  |
      | Reverse Proxy         |
      | Health Checker        |
      +-----------------------+
          |        |        |
          v        v        v
      Backend1 Backend2 Backend3
```

## Complexity

Operation Complexity

---

Hash O(1)
Lookup O(log R)
Add Node O(V log R)
Remove Node O(R)
Distribution O(K log R)

Where: - R = total virtual nodes - V = virtual nodes per backend - K =
number of keys

## Tech Stack

- Node.js (CommonJS)
- http-proxy
- crypto (MD5)
- node:test
- autocannon

## Project Structure

```text
consistent-hash-lb/
├── src/
├── backends/
├── loadtest/
├── scripts/
├── package.json
└── README.md
```

## Running

```bash
npm install
./scripts/start-demo.sh
```

Performance benchmark:

```bash
npm run benchmark
```

Distribution benchmark:

```bash
npm run distribution
```

Debug endpoint:

```bash
curl http://localhost:8080/debug/ring
```

Register a backend at runtime (weight is optional, defaults to 1):

```bash
curl -X POST http://localhost:8080/backends \
  -H "Content-Type: application/json" \
  -d '{"id":"backend-4","host":"localhost","port":4004,"weight":2}'
```

Remove a backend at runtime:

```bash
curl -X DELETE http://localhost:8080/backends/backend-4
```

> The admin API has no authentication, matching the rest of this
> project. Don't expose the load balancer's port to an untrusted
> network without adding one.

Metrics (Prometheus text exposition format):

```bash
curl http://localhost:8080/metrics
```

## Measured Results

### Unit Test

- Distribution across five nodes remained balanced (\~18--22% each).
- Removing one backend remapped **19.66%** of keys, matching the
  theoretical expectation of approximately **20%**.

### Performance Benchmark

Re-measured with `autocannon` (20 connections, 10s) after fixing the
reverse proxy to reuse backend connections (`keepAlive` agent) instead
of opening a new TCP connection per request:

| | Before fix | After fix |
|---|---|---|
| Avg req/sec | 1,369.70 | **9,255.82** |
| Avg latency | 2,459.82 ms | **1.60 ms** |
| Errors | 1,000 / 27,000 | **0** |
| Throughput | 426.68 KB/s | **3,136.09 KB/s** |

> Latency measurements were obtained on a local development environment
> and may vary depending on hardware, Node.js version, and concurrent
> workload.

## Design Decisions

### Why MD5?

MD5 is used for its fast and uniform distribution characteristics.
Cryptographic security is not required because the objective is balanced
hashing, not secure hashing.

### Why Consistent Hashing?

Adding or removing one backend only redistributes a bounded fraction of
keys, preserving cache locality and session affinity.

### Why Virtual Nodes?

Virtual nodes reduce uneven distribution caused by random placement of
physical nodes on the ring.

## Alternative Considered

### Rendezvous (Highest Random Weight) Hashing

Advantages: - No ring required - Excellent distribution

Trade-off: - Requires evaluating every node for each lookup (`O(N)`),
whereas this project performs lookups in `O(log R)` using binary search.

## Current Limitations

- No service discovery
- No TLS termination
- Single load balancer instance
- Admin API (`POST`/`DELETE /backends`) has no authentication
- Dashboard UI exists but isn't wired to the live backend yet

## Future Improvements

- Gossip-based membership
- Docker & Docker Compose
- Kubernetes deployment
- Horizontal load balancer clustering
- Wire the dashboard to `/debug/ring` and the admin API

## Interview Talking Points

- Explain why modulo hashing fails.
- Walk through ring lookup and wraparound.
- Describe the purpose of virtual nodes.
- Discuss binary search complexity.
- Explain automatic failover and recovery.
- Compare consistent hashing with rendezvous hashing.
- Discuss production improvements such as dynamic service discovery
  and weighted routing.

## License

MIT
