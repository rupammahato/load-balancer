# consistent-hash-ring

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
remaps only **~1/N** of keys, not all of them.

## Install

```bash
npm install consistent-hash-ring
```

## Usage

```js
const ConsistentHashRing = require("consistent-hash-ring");

const ring = new ConsistentHashRing({ vnodeCount: 150 });

ring.addNode("cache-1");
ring.addNode("cache-2");
ring.addNode("cache-3", 2); // weight 2 = ~2x the key share

ring.getNode("user:42"); // -> "cache-2", deterministic

ring.removeNode("cache-2"); // only ~1/3 of keys remap, not all
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

## License

MIT
