
docker buildx build -t "lesterthomas/productorderingapi:0.3"  --platform "linux/amd64,linux/arm64" -f productordering-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.1"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productorderinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productorderinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productordercaptureandvalidationmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
