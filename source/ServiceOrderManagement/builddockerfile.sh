#!/bin/bash
# Build and push all Docker images for the ServiceOrderManagement component
# Run from the source/ServiceOrderManagement/ directory

docker buildx build -t "lesterthomas/serviceorderapi:0.1" --platform "linux/amd64,linux/arm64" -f serviceordermanagement-dockerfile . --push

docker buildx build -t "lesterthomas/serviceordermanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f serviceordermanagementinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.1" --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/serviceordermanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push

docker buildx build -t "lesterthomas/serviceordermanagementmcp:0.1" --platform "linux/amd64,linux/arm64" -f serviceordermanagement-mcp-dockerfile . --push
