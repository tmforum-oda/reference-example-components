#!/bin/bash
set -e
NAMESPACE=akumartmf

docker buildx build --platform linux/amd64,linux/arm64 \
  -f servicecat-dockerfile -t ${NAMESPACE}/servicecatalogapi:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f svcquality-dockerfile -t ${NAMESPACE}/servicequalityapi:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f servicecataloginit-dockerfile -t ${NAMESPACE}/servicecataloginitialization:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f openMetricsMicroservice-dockerfile -t ${NAMESPACE}/servicecatalogmetrics:0.1 --push .
