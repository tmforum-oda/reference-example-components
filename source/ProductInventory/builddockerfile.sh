
docker buildx build -t "lesterthomas/productinventoryapi:0.3"  --platform "linux/amd64,linux/arm64" -f productinventory-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.1"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productinventoryinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productinventoryinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productinventorymetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
