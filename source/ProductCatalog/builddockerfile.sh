
docker buildx build -t "lesterthomas/productcatalogapi:0.23"  --platform "linux/amd64,linux/arm64" -f prodcat-dockerfile . --push

docker buildx build -t "lesterthomas/productcatalogmcp:0.4"  --platform "linux/amd64,linux/arm64" -f prodcat-mcp-dockerfile . --push

docker buildx build -t "lesterthomas/promotionmgmtapi:0.2"  --platform "linux/amd64,linux/arm64" -f promotionmgmt-dockerfile . --push

docker buildx build -t "lesterthomas/partyroleapi:0.2"  -t "lesterthomas/partyroleapi:latest" --platform "linux/amd64,linux/arm64" -f partyrole-dockerfile . --push

docker buildx build -t "lesterthomas/permissionspecapi:0.10"  --platform "linux/amd64,linux/arm64" -f permissionspec-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.5"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productcataloginitialization:0.2" --platform "linux/amd64,linux/arm64" -f productcataloginitialization-dockerfile . --push

docker buildx build -t "lesterthomas/openmetrics:1.0" --platform "linux/amd64,linux/arm64" -f registerAllEvents-dockerfile . --push
