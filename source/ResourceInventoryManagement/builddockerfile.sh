
docker buildx build -t "akumartmf/resourceinventoryapi:0.1"  --platform "linux/amd64,linux/arm64" -f resourceinventory-dockerfile . --push

docker buildx build -t "akumartmf/roleinitialization:0.6"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "akumartmf/resourceinventoryinitialization:0.1" --platform "linux/amd64,linux/arm64" -f resourceinventoryinitialization-dockerfile . --push

docker buildx build -t "akumartmf/resourceinventorymetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push

docker buildx build -t "akumartmf/resourceinventorymcp:0.5" --platform "linux/amd64,linux/arm64" -f resourceinventory-mcp-dockerfile . --push
