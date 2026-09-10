# Changelog

All notable changes to this package are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/); versioning
follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-09-10

Initial release. Extracted from
[Ring Console](https://github.com/rupammahato/load-balancer), where it
had already been running as the routing core of a real reverse proxy.

### Added

- `ConsistentHashRing` class: `addNode`, `removeNode`, `getNode`,
  `getDistribution`, `getRingSize`, `getRingSnapshot`, `getUniqueNodes`.
- Weighted nodes — `addNode(id, weight)` scales a node's vnode count
  (and so its key share) relative to its peers.
- TypeScript declarations (`index.d.ts`).
- Zero runtime dependencies (Node's built-in `crypto` only).
