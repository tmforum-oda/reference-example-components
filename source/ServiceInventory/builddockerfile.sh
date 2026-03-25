
docker buildx build -t "lesterthomas/serviceinventoryapi:0.3"  --platform "linux/amd64,linux/arm64" -f serviceinventory-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.6"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/serviceinventoryinitialization:0.1" --platform "linux/amd64,linux/arm64" -f serviceinventoryinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/serviceinventorymetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
