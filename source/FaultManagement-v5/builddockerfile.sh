#!/bin/bash
# Run from source/FaultManagement-v5/
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/faultmanagementapiv5:0.1" --platform "linux/amd64,linux/arm64" -f faultmanagement-dockerfile . --push

docker buildx build -t "akumartmf/faultmanagementinitializationv5:0.1" --platform "linux/amd64,linux/arm64" -f faultmanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/faultmanagementmetricsv5:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
