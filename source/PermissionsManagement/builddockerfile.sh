docker buildx build -t "akumartmf/permissionsmanagementv4api:0.1" --platform "linux/amd64,linux/arm64" -f userrolepermapi-dockerfile . --push

docker buildx build -t "akumartmf/permissionsmanagementpartyroleapiv5api:0.1" --platform "linux/amd64,linux/arm64" -f partyroleapiv5-dockerfile . --push

docker buildx build -t "akumartmf/permissionsmanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f permissionsmanagementinitialization-dockerfile . --push

docker buildx build -t "akumartmf/openmetrics:1.0" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
