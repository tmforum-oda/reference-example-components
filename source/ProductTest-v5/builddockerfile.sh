#!/bin/bash
# Build and push all Docker images for ProductTest-v5
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/producttestapi:0.1" --platform "linux/amd64,linux/arm64" -f producttest-dockerfile . --push

docker buildx build -t "akumartmf/producttestmanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f producttestmanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/producttestmanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
