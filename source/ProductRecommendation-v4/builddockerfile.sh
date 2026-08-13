#!/bin/bash
# Build and push all Docker images for ProductRecommendation-v4

# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "akumartmf/recommendationapi:0.3" --platform "linux/amd64,linux/arm64" -f recommendation-dockerfile . --push

docker buildx build -t "akumartmf/productrecommendationmanagementinitialization:0.2" --platform "linux/amd64,linux/arm64" -f productrecommendationmanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/productrecommendationmanagementmetrics:0.2" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
