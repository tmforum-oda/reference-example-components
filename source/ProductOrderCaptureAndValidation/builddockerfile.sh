
docker buildx build -t "lesterthomas/productorderingapi:0.9"  --platform "linux/amd64,linux/arm64" -f productordering-dockerfile . --push

docker buildx build -t "lesterthomas/roleinitialization:0.1"  --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "lesterthomas/productorderinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productorderinitialization-dockerfile . --push

docker buildx build -t "adarshkrm/productordercaptureandvalidationmetrics:0.4" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push

docker buildx build -t "adarshkrm/productorderprocessor:0.1" --platform "linux/amd64,linux/arm64" -f productorderprocessor-dockerfile . --push
