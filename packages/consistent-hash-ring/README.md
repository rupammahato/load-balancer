# consistent-hash-ring

[![npm version](https://img.shields.io/npm/v/consistent-hash-ring.svg)](https://www.npmjs.com/package/consistent-hash-ring)
[![license](https://img.shields.io/npm/l/consistent-hash-ring.svg)](https://github.com/rupammahato/load-balancer/blob/main/packages/consistent-hash-ring/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/consistent-hash-ring.svg)](https://www.npmjs.com/package/consistent-hash-ring)

A small, dependency-free consistent hashing ring with weighted virtual
nodes. Deterministically maps keys onto a changing set of nodes —
useful anywhere you need that, not just load balancing: a sharded
cache, a distributed job queue, assigning WebSocket rooms to server
instances, or your own load balancer.

Extracted from [Ring Console](https://github.com/rupammahato/load-balancer),
a load balancer built around this exact ring — see that repo for a
full working example (reverse proxy, health checks, a live dashboard
that visualizes the ring in real time).

## Why consistent hashing

Naive `hash(key) % N` remaps almost every key whenever `N` changes —
adding or removing one node reshuffles the entire keyspace. Consistent
hashing places both nodes and keys on the same ring; removing one node
remaps only **~1/N** of keys, not all of them. Measured, not just
claimed — removing 1 of 5 nodes below remapped 22.9% of 5,000 keys,
matching the ~20% expectation.

## Install

```bash
npm install consistent-hash-ring
```

Works from both CommonJS and TypeScript out of the box — type
declarations are bundled, no `@types/` package needed.

```js
const ConsistentHashRing = require("consistent-hash-ring");
```

```ts
import ConsistentHashRing = require("consistent-hash-ring");
```

## Quick start

```js
const ConsistentHashRing = require("consistent-hash-ring");

const ring = new ConsistentHashRing({ vnodeCount: 150 });

ring.addNode("cache-1");
ring.addNode("cache-2");
ring.addNode("cache-3", 2); // weight 2 = ~2x the key share

ring.getNode("user:42"); // -> "cache-2", deterministic

ring.removeNode("cache-2"); // only ~1/3 of keys remap, not all
```

## Examples

Every example below is verified against the actual package (see the
"Why consistent hashing" measurement above — same method).

### Sharded cache

Route a key to the cache instance that owns it — client-side sharding,
no coordinator needed.

```js
const ring = new ConsistentHashRing({ vnodeCount: 150 });
ring.addNode("cache-1.internal:6379");
ring.addNode("cache-2.internal:6379");
ring.addNode("cache-3.internal:6379");

function cacheFor(key) {
  return ring.getNode(key);
}

cacheFor("user:42"); // -> "cache-2.internal:6379", every time
```

### Distributed job queue

Assign jobs to workers, weighting workers by capacity.

```js
const ring = new ConsistentHashRing({ vnodeCount: 100 });
ring.addNode("worker-a");
ring.addNode("worker-b");
ring.addNode("worker-c", 2); // worker-c has more capacity

function workerFor(jobId) {
  return ring.getNode(jobId);
}

workerFor("job:1001"); // -> a specific worker, deterministically

// worker-b goes offline: only its jobs remap, not everyone's
ring.removeNode("worker-b");
```

### WebSocket room assignment

Pin a room to one server instance so all its connections land in the
same process.

```js
const ring = new ConsistentHashRing({ vnodeCount: 150 });
ring.addNode("ws-server-1");
ring.addNode("ws-server-2");

function serverForRoom(roomId) {
  return ring.getNode(`room:${roomId}`);
}
```

## API

### `new ConsistentHashRing({ vnodeCount = 150 })`

`vnodeCount` is the number of virtual nodes per unit of weight. Higher
means smoother distribution at the cost of more memory/insert time —
150 is a reasonable default; production systems commonly use
100–500.

### `.addNode(nodeId, weight = 1)`

Adds a node to the ring. `weight` scales its vnode count (and so its
key share) relative to other nodes — a weight-2 node takes roughly
twice the keys of a weight-1 node.

### `.removeNode(nodeId)`

Removes every vnode belonging to a node.

### `.getNode(key)`

Returns the node id that owns `key`. Deterministic — same key, same
node, until the ring's membership changes. Throws if the ring is
empty.

### `.getDistribution(sampleKeys)`

Routes an array of keys and returns `{ nodeId: count }` — useful for
testing/visualizing how evenly a given key set spreads.

### `.getRingSize()`

Total vnode count currently on the ring.

### `.getRingSnapshot()`

A copy of every `{ hash, nodeId }` vnode entry, sorted by hash — for
building a visualization (this is what Ring Console's dashboard uses
to plot the real ring).

### `.getUniqueNodes()`

The distinct node ids currently on the ring.

## Complexity

| Operation | Complexity |
|---|---|
| Hash | O(1) |
| Lookup (`getNode`) | O(log R) |
| Add node | O(V log R) |
| Remove node | O(R) |
| Distribution (`getDistribution`) | O(K log R) |

Where R = total vnodes on the ring, V = vnodes added, K = keys routed.

## Design notes

- **Hashing:** MD5, truncated to a 32-bit unsigned int. Chosen for
  speed and uniform distribution — this is not a security context, so
  cryptographic strength isn't a requirement.
- **Lookup:** binary search over a sorted array, not a full scan
  (`O(log R)` vs. the `O(N)` a rendezvous/HRW hashing approach would
  need per lookup — the trade-off is `addNode`/`removeNode` cost
  instead of lookup cost).
- **Zero dependencies:** just Node's built-in `crypto`. Nothing to
  audit beyond this one file, nothing to break on someone else's
  breaking change.
- **No native bindings:** pure JS — `npm install` never needs a
  compiler toolchain.

## Tests

```bash
npm test
```

Covers even distribution, the ~1/N remap guarantee on node removal,
deterministic routing, wraparound, and proportional weighted share
(both vnode count and measured key share).

## Contributing

Issues and PRs welcome at the
[monorepo](https://github.com/rupammahato/load-balancer) — this
package lives at `packages/consistent-hash-ring`. Run `npm test` from
this directory, or `npm run test:all` from the repo root to run this
package's tests alongside the load balancer's.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
