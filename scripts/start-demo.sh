#!/bin/bash

set -e

echo "========================================="
echo " Consistent Hashing Load Balancer Demo"
echo "========================================="
echo

cleanup() {

    echo
    echo "Stopping all processes..."

    kill "$LB_PID" 2>/dev/null || true
    kill "$B1_PID" 2>/dev/null || true
    kill "$B2_PID" 2>/dev/null || true
    kill "$B3_PID" 2>/dev/null || true

    wait

    echo
    echo "Cleanup complete."
}

trap cleanup SIGINT SIGTERM EXIT

echo "Starting backend-1..."
node backends/dummy-server.js 4001 &
B1_PID=$!

echo "Starting backend-2..."
node backends/dummy-server.js 4002 &
B2_PID=$!

echo "Starting backend-3..."
node backends/dummy-server.js 4003 &
B3_PID=$!

sleep 2

echo
echo "Starting Load Balancer..."

node src/server.js &
LB_PID=$!

sleep 2

echo
echo "========================================="
echo "Processes"
echo "========================================="

echo "backend-1 : PID $B1_PID"
echo "backend-2 : PID $B2_PID"
echo "backend-3 : PID $B3_PID"
echo "load-balancer : PID $LB_PID"

echo
echo "========================================="
echo "Useful Commands"
echo "========================================="

echo
echo "Health:"
echo "curl http://localhost:8080/debug/ring"

echo
echo "Send Request:"
echo "curl http://localhost:8080"

echo
echo "Performance:"
echo "npm run benchmark"

echo
echo "Distribution:"
echo "npm run distribution"

echo
echo "Kill backend-2:"
echo "kill $B2_PID"

echo
echo "Restart backend-2:"
echo "node backends/dummy-server.js 4002"

echo
echo "Press Ctrl+C to stop everything."

wait