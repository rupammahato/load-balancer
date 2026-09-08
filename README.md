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
- Virtual Nodes (150 per backend)
- Binary Search lookup (`O(log R)`)
- Deterministic routing
- Reverse proxy using `http-proxy`
- Automatic health checking
- Automatic backend removal & recovery
- Configurable routing strategy
  - Client IP
  - URL Path
  - Custom Header
- Performance benchmark
- Distribution benchmark
- Debug endpoint (`/debug/ring`)
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

## Measured Results

### Unit Test

- Distribution across five nodes remained balanced (\~18--22% each).
- Removing one backend remapped **19.66%** of keys, matching the
  theoretical expectation of approximately **20%**.

### Performance Benchmark

- Average Requests/sec: **2045.70**
- Total Requests: **\~41,000 in 10 seconds**
- Average Throughput: **\~637 KB/s**

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

- Static backend configuration
- No service discovery
- No weighted virtual nodes
- No TLS termination
- Single load balancer instance

## Future Improvements

- Gossip-based membership
- Weighted backends
- Metrics (Prometheus)
- Docker & Docker Compose
- Kubernetes deployment
- Horizontal load balancer clustering

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
