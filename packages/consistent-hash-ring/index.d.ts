/**
 * A consistent hashing ring with weighted virtual nodes.
 *
 * Deterministically maps keys onto a changing set of nodes so that
 * adding or removing one node remaps only ~1/N of keys, not the whole
 * keyspace. Useful for sharded caches, distributed job queues,
 * WebSocket room assignment, or load balancing.
 */
declare class ConsistentHashRing {
    constructor(options?: ConsistentHashRing.ConsistentHashRingOptions);

    /** Virtual nodes per unit of weight, as passed to the constructor. */
    vnodeCount: number;

    /**
     * The sorted vnode array backing the ring. Exposed for callers
     * that need direct access (e.g. tests); prefer getRingSnapshot()
     * for a safe copy.
     */
    ring: ConsistentHashRing.VnodeEntry[];

    /** Hashes a string to a 32-bit unsigned integer (MD5-based). */
    hashFn(str: string): number;

    /**
     * Binary search for the insertion index of a hash value.
     * Internal implementation detail of addNode; not usually needed
     * by callers.
     */
    findInsertIndex(hash: number): number;

    /**
     * Adds a node to the ring. `weight` scales its vnode count (and
     * so its key share) relative to other nodes.
     */
    addNode(nodeId: string, weight?: number): void;

    /** Removes every vnode belonging to a node. */
    removeNode(nodeId: string): void;

    /**
     * Returns the node id that owns `key`. Deterministic until the
     * ring's membership changes.
     * @throws {Error} if the ring is empty
     */
    getNode(key: string): string;

    /** Routes an array of keys and returns { nodeId: count }. */
    getDistribution(sampleKeys: string[]): Record<string, number>;

    /** Total vnode count currently on the ring. */
    getRingSize(): number;

    /** A copy of every vnode entry, sorted by hash. */
    getRingSnapshot(): ConsistentHashRing.VnodeEntry[];

    /** The distinct node ids currently on the ring. */
    getUniqueNodes(): string[];
}

declare namespace ConsistentHashRing {
    /** One virtual node's position on the ring. */
    export interface VnodeEntry {
        hash: number;
        nodeId: string;
    }

    export interface ConsistentHashRingOptions {
        /**
         * Virtual nodes per unit of weight. Higher means smoother
         * distribution at the cost of more memory/insert time.
         * @default 150
         */
        vnodeCount?: number;
    }
}

export = ConsistentHashRing;
