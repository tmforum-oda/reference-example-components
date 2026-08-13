#!/bin/bash
# Build and push all Docker images for PartyPrivacyManagement-v5

# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/privacymanagementv5api:0.1" --platform "linux/amd64,linux/arm64" -f privacymanagementapi-dockerfile . --push

docker buildx build -t "akumartmf/privacymanagementv5initialization:0.1" --platform "linux/amd64,linux/arm64" -f privacymanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/privacymanagementv5metrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
