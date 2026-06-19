#!/bin/bash
# Run from source/ProductInventory-v5/
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/productinventoryapi:0.1" --platform "linux/amd64,linux/arm64" -f productinventory-dockerfile . --push

docker buildx build -t "akumartmf/productinventoryinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productinventoryinitialization-dockerfile . --push

docker buildx build -t "akumartmf/productinventorymetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
