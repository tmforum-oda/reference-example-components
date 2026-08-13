#!/bin/bash
# Run from source/ServiceInventory-v5/
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/serviceinventoryapiv5:0.1" --platform "linux/amd64,linux/arm64" -f serviceinventory-dockerfile . --push

docker buildx build -t "akumartmf/serviceinventoryinitializationv5:0.1" --platform "linux/amd64,linux/arm64" -f serviceinventoryinitialization-dockerfile . --push

docker buildx build -t "akumartmf/serviceinventorymetricsv5:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push

docker buildx build -t "akumartmf/serviceinventorymcp:0.1" --platform "linux/amd64,linux/arm64" -f serviceinventory-mcp-dockerfile . --push
