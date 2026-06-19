#!/bin/bash
# Build and push all Docker images for PartyManagement

# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/partymanagementv5api:0.1" --platform "linux/amd64,linux/arm64" -f partymngt-dockerfile . --push

docker buildx build -t "akumartmf/partymanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f partymngtinitialization-dockerfile . --push

docker buildx build -t "akumartmf/partymanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f partymngt-metricsapi-dockerfile . --push
