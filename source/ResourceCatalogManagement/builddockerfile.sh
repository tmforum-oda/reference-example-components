#!/bin/bash
# Run from source/ResourceCatalogManagement/
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/resourcecatalogv5api:0.1" --platform "linux/amd64,linux/arm64" -f rescatapi-dockerfile . --push

docker buildx build -t "akumartmf/roleinitialization:0.1" --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "akumartmf/resourcecatalogmanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f resourcecatalogmanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/resourcecatalogmanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
