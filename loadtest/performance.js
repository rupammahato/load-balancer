/**
 * ------------------------------------------------------------
 * Performance Benchmark
 * ------------------------------------------------------------
 *
 * Measures:
 * - Requests/sec
 * - Throughput
 * - Latency
 *
 * Uses Autocannon exactly as intended.
 */

const autocannon = require("autocannon");

const instance = autocannon({
    url: "http://localhost:8080",
    connections: 20,
    duration: 10
});

autocannon.track(instance);

instance.on("done", result => {

    console.log("\n==============================");
    console.log("Performance Summary");
    console.log("==============================");

    console.log(`Average Req/sec : ${result.requests.average.toFixed(2)}`);
    console.log(`Average Latency : ${result.latency.average.toFixed(2)} ms`);
    console.log(`P99 Latency     : ${result.latency.p99.toFixed(2)} ms`);
    console.log(`Throughput      : ${(result.throughput.average / 1024).toFixed(2)} KB/s`);

});