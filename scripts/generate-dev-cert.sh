#!/bin/bash
#
# Generates a self-signed TLS cert for local development.
# Never commit certs/ — it's gitignored.

set -e

mkdir -p certs

# MSYS_NO_PATHCONV avoids Git Bash on Windows rewriting the leading
# "/CN=..." as a filesystem path.
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout certs/dev-key.pem \
    -out certs/dev-cert.pem \
    -days 365 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo
echo "Generated certs/dev-cert.pem and certs/dev-key.pem"
echo
echo "Run the load balancer with TLS:"
echo "  TLS_CERT_PATH=certs/dev-cert.pem TLS_KEY_PATH=certs/dev-key.pem npm start"
echo
echo "Self-signed — browsers/curl will warn. For curl, add -k."
