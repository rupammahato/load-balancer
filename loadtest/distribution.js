/**
 * ------------------------------------------------------------
 * Distribution Benchmark
 * ------------------------------------------------------------
 *
 * Sends requests with different X-Client-Id headers to verify
 * consistent hash distribution.
 */

const backendCounts = {};

const TOTAL_REQUESTS = 2000;

async function main() {

    for (let i = 0; i < TOTAL_REQUESTS; i++) {

        const clientId = `client-${Math.floor(Math.random() * 500)}`;

        const response = await fetch(
            "http://localhost:8080",
            {
                headers: {
                    "X-Client-Id": clientId
                }
            }
        );

        const backend =
            response.headers.get("X-Upstream-Backend");

        backendCounts[backend] ??= 0;
        backendCounts[backend]++;

    }

    console.log("\n==============================");
    console.log("Distribution");
    console.log("==============================");

    for (const [backend, count] of Object.entries(backendCounts)) {

        const percentage =
            (count / TOTAL_REQUESTS * 100).toFixed(2);

        console.log(
            `${backend.padEnd(12)} : ${count
                .toString()
                .padStart(4)} requests (${percentage}%)`
        );

    }

}

main().catch(console.error);