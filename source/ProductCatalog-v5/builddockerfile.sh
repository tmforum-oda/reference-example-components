#!/bin/bash
# Build and push all Docker images for ProductCatalog-v5

# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/productcatalogv5api:0.1" --platform "linux/amd64,linux/arm64" -f prodcatapiv5-dockerfile . --push

docker buildx build -t "akumartmf/roleinitialization:0.1" --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "akumartmf/productcatalogv5initialization:0.1" --platform "linux/amd64,linux/arm64" -f productcataloginitialization-dockerfile . --push

docker buildx build -t "akumartmf/productcatalogv5metrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
