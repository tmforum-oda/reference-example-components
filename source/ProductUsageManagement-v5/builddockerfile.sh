#!/bin/bash
# Build and push all Docker images for ProductUsageManagement-v5

# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/usagemanagementapi:0.1" --platform "linux/amd64,linux/arm64" -f usageapi-dockerfile . --push

docker buildx build -t "akumartmf/usageconsumptionapi:0.7" --platform "linux/amd64,linux/arm64" -f usageconsumptionapi-dockerfile . --push

docker buildx build -t "akumartmf/productusagemanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productusagemanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/productusagemanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
