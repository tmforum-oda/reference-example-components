#!/bin/bash
docker buildx build -t "lesterthomas/partymanagementapi:0.3"  --platform "linux/amd64,linux/arm64" -f partymanagement-dockerfile . --push
docker buildx build -t "lesterthomas/partymanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f partymanagementinitialization-dockerfile . --push
docker buildx build -t "lesterthomas/partymanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
