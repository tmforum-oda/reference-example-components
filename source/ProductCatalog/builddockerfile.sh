
docker buildx build -t "lesterthomas/productcatalogapi:1.3"  --platform "linux/amd64,linux/arm64" -f prodcat-dockerfile . --push

docker buildx build -t "lesterthomas/productcatalogmcp:0.14"  --platform "linux/amd64,linux/arm64" -f prodcat-mcp-dockerfile . --push

docker buildx build -t "lesterthomas/promotionmgmtapi:0.6"  --platform "linux/amd64,linux/arm64" -f promotionmgmt-dockerfile . --push

docker buildx build -t "lesterthomas/partyroleapi:1.1"  -t "lesterthomas/partyroleapi:latest" --platform "linux/amd64,linux/arm64" -f partyrole-dockerfile . --push

docker buildx build -t "lesterthomas/permissionspecapi:0.10"  --platform "linux/amd64,linux/arm64" -f permissionspec-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.5"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productcataloginitialization:0.2" --platform "linux/amd64,linux/arm64" -f productcataloginitialization-dockerfile . --push

docker buildx build -t "lesterthomas/openmetrics:1.0" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
