#!/bin/bash
set -e
NAMESPACE=akumartmf

docker buildx build --platform linux/amd64,linux/arm64 \
  -f resourceordering-dockerfile -t ${NAMESPACE}/resourceorderingapi:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f roleinitialization-dockerfile -t ${NAMESPACE}/roleinitialization:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f resourceorderinginit-dockerfile -t ${NAMESPACE}/resourceorderinginitialization:0.1 --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f openMetricsMicroservice-dockerfile -t ${NAMESPACE}/resourceorderingmetrics:0.1 --push .
