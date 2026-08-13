#!/bin/bash
# Build and push all Docker images for ServiceTest-v5
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/servicetestapi:0.1" --platform "linux/amd64,linux/arm64" -f servicetest-dockerfile . --push

docker buildx build -t "akumartmf/servicetestmanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f servicetestmanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/servicetestmanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
