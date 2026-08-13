#!/bin/bash
# Run from source/ResourceConfigAndActivation-v4/
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/resourceconfigandactivationapiv4:0.1" --platform "linux/amd64,linux/arm64" -f resourceconfigandactivation-dockerfile . --push

docker buildx build -t "akumartmf/resourceconfigandactivationinitializationv4:0.1" --platform "linux/amd64,linux/arm64" -f resourceconfigandactivationinitialization-dockerfile . --push

docker buildx build -t "akumartmf/resourceconfigandactivationmetricsv4:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
