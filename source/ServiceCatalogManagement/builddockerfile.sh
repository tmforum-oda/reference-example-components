#!/bin/bash

# Build and push Docker images for TMFC006 Service Catalog Management
# Prerequisites: docker buildx with multi-platform support
# Usage: ./builddockerfile.sh

set -e

NAMESPACE="lesterthomas"

# Copy shared utils into each microservice before building
echo "Copying shared utils to microservices..."
for svc in serviceCatalogMicroservice serviceQualityManagementMicroservice processFlowMicroservice; do
  mkdir -p ${svc}/implementation/utils
  cp -r ../../skills/create-oda-component/templates/source/utils/* ${svc}/implementation/utils/
  cp ../../skills/create-oda-component/templates/source/index.html_replacement ${svc}/implementation/
done

echo "Building Service Catalog API (TMF633)..."
docker buildx build -t "${NAMESPACE}/servicecatalogapi:0.1" --platform "linux/amd64,linux/arm64" -f svcatapi-dockerfile . --push

echo "Building Service Quality Management API (TMF657)..."
docker buildx build -t "${NAMESPACE}/servicequalityapi:0.1" --platform "linux/amd64,linux/arm64" -f svcqualapi-dockerfile . --push

echo "Building Process Flow Management API (TMF701)..."
docker buildx build -t "${NAMESPACE}/processflowapi:0.1" --platform "linux/amd64,linux/arm64" -f procflowapi-dockerfile . --push

echo "Building Role Initialization..."
docker buildx build -t "${NAMESPACE}/roleinit-servicecatalog:0.1" --platform "linux/amd64,linux/arm64" -f roleinit-dockerfile . --push

echo "Building Open Metrics..."
docker buildx build -t "${NAMESPACE}/openmetrics-servicecatalog:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push

echo "Building Service Catalog Initialization..."
docker buildx build -t "${NAMESPACE}/servicecataloginit:0.1" --platform "linux/amd64,linux/arm64" -f svcatinit-dockerfile . --push

echo "Building Service Catalog MCP Server..."
docker buildx build -t "${NAMESPACE}/servicecatalogmcp:0.1" --platform "linux/amd64,linux/arm64" -f svcatmcp-dockerfile . --push

echo "All images built and pushed successfully."
