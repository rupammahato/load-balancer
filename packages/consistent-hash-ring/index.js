/**
 * ------------------------------------------------------------
 * Consistent Hash Ring
 * ------------------------------------------------------------
 *
 * This module implements a consistent hashing ring using
 * virtual nodes (vnodes).
 *
 * Both nodes and keys are hashed into the same circular hash
 * space.
 *
 * Routing:
 *
 *      hash(key)
 *          |
 *          v
 *   ---------------------->
 *   Find first vnode whose
 *   hash >= key hash
 *
 * If none exists, wrap around to the beginning of the ring.
 *
 * This wraparound behavior is what makes the structure a
 * "ring" instead of a simple sorted array.
 */

const crypto = require("crypto");

class ConsistentHashRing {
    constructor({ vnodeCount = 150 } = {}) {
        this.vnodeCount = vnodeCount;

        /**
         * Sorted array of:
         * {
         *      hash: Number,
         *      nodeId: String
         * }
         */
        this.ring = [];
    }

    /**
     * Convert any string into a 32-bit unsigned integer
     * using the first 4 bytes of an MD5 hash.
     */
    hashFn(str) {
        const digest = crypto
            .createHash("md5")
            .update(str)
            .digest();

        return digest.readUInt32BE(0);
    }

    /**
     * Binary search for the correct insertion position.
     */
    findInsertIndex(hash) {
        let left = 0;
        let right = this.ring.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);

            if (this.ring[mid].hash < hash) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return left;
    }

    /**
     * Add one node to the ring.
     *
     * Each node is represented by many virtual nodes spread
     * around the ring. A node with weight 2 gets twice the
     * vnodes (and roughly twice the key share) of a node with
     * weight 1.
     */
    addNode(nodeId, weight = 1) {
        const vnodeCount = Math.max(1, Math.round(this.vnodeCount * weight));

        for (let i = 0; i < vnodeCount; i++) {
            const vnodeHash = this.hashFn(`${nodeId}#${i}`);

            const entry = {
                hash: vnodeHash,
                nodeId
            };

            const index = this.findInsertIndex(vnodeHash);

            this.ring.splice(index, 0, entry);
        }
    }

    /**
     * Remove every vnode belonging to a node.
     */
    removeNode(nodeId) {
        this.ring = this.ring.filter(
            entry => entry.nodeId !== nodeId
        );
    }

    /**
     * Find which node owns a given key.
     *
     * Binary search finds the first vnode whose hash
     * is greater than or equal to the key hash.
     *
     * WRAPAROUND:
     * If the key hash is larger than every vnode hash,
     * ownership wraps back to the first vnode.
     */
    getNode(key) {
        if (this.ring.length === 0) {
            throw new Error("Hash ring is empty.");
        }

        const keyHash = this.hashFn(key);

        let left = 0;
        let right = this.ring.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);

            if (this.ring[mid].hash < keyHash) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        /**
         * Wraparound.
         *
         * Example:
         *
         * Ring:
         * 10 ---- 80 ---- 140
         *
         * Key hash:
         * 220
         *
         * Since 220 is larger than every vnode,
         * the search lands beyond the array.
         *
         * We wrap back to index 0.
         */
        if (left === this.ring.length) {
            return this.ring[0].nodeId;
        }

        return this.ring[left].nodeId;
    }

    /**
     * Route many keys and count how many each node owns.
     */
    getDistribution(sampleKeys) {
        const distribution = {};

        for (const key of sampleKeys) {
            const node = this.getNode(key);

            distribution[node] ??= 0;
            distribution[node]++;
        }

        return distribution;
    }

    /**
     * Total virtual node count currently on the ring.
     */
    getRingSize() {
        return this.ring.length;
    }

    /**
     * A copy of every {hash, nodeId} vnode entry, sorted by hash.
     */
    getRingSnapshot() {
        return [...this.ring];
    }

    getUniqueNodes() {
        return [...new Set(this.ring.map(entry => entry.nodeId))];
    }
}

module.exports = ConsistentHashRing;
