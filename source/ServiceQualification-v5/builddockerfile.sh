#!/bin/bash
set -e
# Build and push all Docker images for ServiceQualification-v5
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

NAMESPACE=akumartmf

docker buildx build --platform linux/amd64,linux/arm64 \
  -f svcqualification-dockerfile -t ${NAMESPACE}/servicequalificationapi:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f roleinitialization-dockerfile -t ${NAMESPACE}/roleinitialization:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f svcqualificationinit-dockerfile -t ${NAMESPACE}/servicequalificationinitialization:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f openMetricsMicroservice-dockerfile -t ${NAMESPACE}/servicequalificationmetrics:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 -f servicequalification-mcp-dockerfile -t ${NAMESPACE}/servicequalificationmcp:0.3 --push .

docker buildx build --platform linux/amd64,linux/arm64 -f servicequalification-a2a-dockerfile -t ${NAMESPACE}/servicequalificationa2a:0.3 --push .
