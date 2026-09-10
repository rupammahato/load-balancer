# Consistent Hashing Load Balancer

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)

> A systems-level backend project implementing a **consistent hashing
> based HTTP load balancer** in Node.js using virtual nodes, automatic
> health checks, reverse proxying and deterministic request routing.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Why Naïve Routing Fails](#why-naïve-routing-fails)
- [Consistent Hashing](#consistent-hashing)
- [Virtual Nodes](#virtual-nodes)
- [Architecture](#architecture)
- [Complexity](#complexity)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Running](#running)
- [Dashboard](#dashboard)
- [TLS Termination](#tls-termination)
- [Measured Results](#measured-results)
- [Design Decisions](#design-decisions)
- [Alternative Considered](#alternative-considered)
- [Horizontal Scaling](#horizontal-scaling)
- [Practical Uses](#practical-uses)
- [Current Limitations](#current-limitations)
- [Future Improvements](#future-improvements)
- [Interview Talking Points](#interview-talking-points)
- [License](#license)

## Overview

This project demonstrates how modern distributed systems route requests
without causing massive remapping whenever backend servers are added or
removed.

Instead of using naïve modulo hashing (`hash(key) % N`), this project
implements **consistent hashing**, where both servers and request keys
are placed onto the same hash ring. Removing one backend only
redistributes approximately **1/N** of the keys rather than the entire
keyspace.

The ring implementation itself is a standalone package —
[`packages/consistent-hash-ring`](packages/consistent-hash-ring) — with
zero dependencies on the rest of this project. It's useful anywhere you
need to deterministically map keys onto a changing set of nodes, not
just HTTP load balancing: a sharded cache, a distributed job queue,
WebSocket room assignment. This repo is one real, fully worked example
of using it.

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
- Live traffic stream (`/debug/traffic/stream`, Server-Sent Events) — every real proxied request, pushed as it happens
- Structured (JSON) logs for health transitions and proxy errors
- Graceful shutdown

## Requirements

- **Node.js >= 18** (uses built-in `fetch` and `AbortSignal.timeout`)
- **npm >= 7** (this repo uses [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) — `packages/consistent-hash-ring` is a linked workspace member, not a copy)
- **Docker + Docker Compose** — optional, only for the [multi-instance demo](#docker-compose)
- **openssl** — optional, only for [TLS termination](#tls-termination)'s dev-cert script

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

Each backend is represented by **150 virtual nodes** by default,
improving load distribution and reducing hotspot formation. A
backend's vnode count scales with its `weight` (`POST /backends` or
`config.js`) — a weight-2 backend gets ~2x the vnodes, and so ~2x the
key share of a weight-1 peer. Verified live: a weight-2 backend among
three weight-1 peers measured 38.45% of traffic against a 40%
theoretical share (2 of 5 total weight units).

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
├── packages/
│   └── consistent-hash-ring/   (standalone, publishable — the ring itself)
├── src/
├── backends/
├── dashboard/
├── loadtest/
├── scripts/
├── docker/
├── Dockerfile
├── docker-compose.yml
├── package.json                (npm workspaces root)
└── README.md
```

## Running

```bash
npm install
./scripts/start-demo.sh
```

Run every test (the ring package and the load balancer):

```bash
npm run test:all
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

Live traffic stream (Server-Sent Events — every real request as it's proxied):

```bash
curl -N http://localhost:8080/debug/traffic/stream
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

## Dashboard

`dashboard/` ("Ring Console") is a live operations view of the real
system, not a mockup and not only a simulator. It polls `/debug/ring`
every 2.5s for topology/health state, and holds an open connection to
`/debug/traffic/stream` (Server-Sent Events) for every real request
the load balancer proxies, as it happens.

```bash
cd dashboard
npm install
npm run dev
```

Requires the load balancer running at `http://localhost:8080` (override
with `VITE_LB_URL`). Open the printed local URL, click **Open
Console**, then:

- **Live Traffic** (bottom-right panel + pulses on the ring itself) is
  *real* traffic — actual requests hitting the load balancer, not a
  demo. Generate some with `curl http://localhost:8080/`, a browser
  tab, or `npm run distribution`, and watch it appear.
- **Generate Keys** / **Route Keys** is the separate simulated demo:
  resolves synthetic keys against the real ring (`/debug/route`) and
  draws each one's hash position with a persistent line to its
  backend — distinct on the ring from the ephemeral live-traffic
  pulses. Re-run **Route Keys** after adding/removing a backend to see
  **Moved Keys** demonstrate consistent hashing's core property
  (removing/adding one backend only remaps ~1/N of keys).
- **Add Backend** / **Remove Backend** call the admin API directly;
  the ring, stats, and event log update immediately.

## TLS Termination

Off by default. Enable it with a cert/key pair:

```bash
./scripts/generate-dev-cert.sh   # self-signed, local dev only
TLS_CERT_PATH=certs/dev-cert.pem TLS_KEY_PATH=certs/dev-key.pem npm start
```

The server then speaks HTTPS only on `LB_PORT` (plain HTTP requests to
it fail, verified: `curl` gets "Empty reply from server"). For a real
deployment, point `TLS_CERT_PATH`/`TLS_KEY_PATH` at a CA-issued cert
(e.g. Let's Encrypt) instead of the self-signed dev one.

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

## Horizontal Scaling

Multiple load balancer instances need no coordination protocol to
route identically — this was measured, not assumed (see `docker
compose up` below):

- **Routing is a pure function** of (backend list, vnode count) via
  `hashFn`. Two instances given the same static config independently
  build byte-identical rings and agree on every key.
- **Health-check-driven failover converges independently.** Each
  instance polls the same backends on its own schedule; killing a
  backend gets it evicted from every instance's ring within one health
  check interval, with zero inter-instance communication. Verified:
  killing a backend under a 2-instance `docker compose` stack evicted
  it from both instances' rings at the same time.
- **The actual gap:** runtime admin-API changes (`POST`/`DELETE
  /backends`) only affect the instance that received the call. A
  backend registered via the API on `lb-1` is invisible to `lb-2` —
  verified live, not theoretical. There's no propagation mechanism.

For a multi-instance deployment today: either keep the backend list in
static config (`BACKENDS_JSON`, identical across instances — this is
what `docker-compose.yml` does) so it converges for free, or call the
admin API against every instance when registering a backend at
runtime. A gossip/anti-entropy protocol to propagate admin-API changes
automatically is a real, substantial distributed-systems undertaking
(failure detection, suspicion states, convergence under partition) —
out of scope here, but this section names exactly what it would need
to solve.

### Docker Compose

Demonstrates the above: 3 backends, 2 independent load balancer
instances sharing one static `BACKENDS_JSON`, and nginx as an L4-ish
round-robin front door across the two instances.

```bash
docker compose up --build
```

- `http://localhost:8080` — nginx, round-robins across `lb-1`/`lb-2`
- `http://localhost:8081`, `:8082` — each LB instance directly (e.g.
  to compare their `/debug/ring` output, which will always match)

## Practical Uses

This started as a project to demonstrate understanding of consistent
hashing (see [Interview Talking Points](#interview-talking-points)
below). It's grown past that into a few things that are useful on
their own:

- **A reusable hashing library.** The ring itself —
  [`packages/consistent-hash-ring`](packages/consistent-hash-ring) —
  is a standalone, dependency-free, TypeScript-typed npm package.
  Consistent hashing isn't only for HTTP load balancing: the same
  `ConsistentHashRing` class works for client-side cache sharding,
  distributed job/worker assignment, or pinning WebSocket rooms to
  server instances. Once published, `npm install consistent-hash-ring`
  uses it directly, without the rest of this project — until then, see
  [its README](packages/consistent-hash-ring) for the same usage.
- **A local dev/debug load balancer with real visibility.** Most
  reverse proxies (nginx, HAProxy, Envoy) give you zero insight into
  per-key routing decisions or vnode distribution without external
  tooling. [Ring Console](#dashboard) shows it live — which backend a
  request actually landed on, how a key remaps when a backend is
  added or removed, and how failover unfolds in real time. Useful for
  answering "is my sticky-session key actually sticky?" or "what does
  my failover actually look like?" while developing against a
  multi-instance service locally, without reading proxy access logs.
- **A worked reference for horizontal LB deployment.** The [Horizontal
  Scaling](#horizontal-scaling) section above and the Docker Compose
  setup are a concrete, runnable example of what does and doesn't
  need coordination when running multiple load balancer instances —
  not just a claim, something you can `docker compose up` and verify
  yourself.

## Current Limitations

- No service discovery
- Single load balancer instance in the default (non-Docker) setup
- Admin API (`POST`/`DELETE /backends`) has no authentication or
  cross-instance propagation (see Horizontal Scaling above)

## Future Improvements

- Gossip/anti-entropy propagation for runtime admin-API changes
- Kubernetes deployment

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

[MIT](LICENSE) — `packages/consistent-hash-ring` carries its own copy
of the same license, since it's independently publishable.
