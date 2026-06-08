# Product Order Processor Microservice

## Overview

This microservice runs as a background processor that continuously processes Product Orders in the MongoDB database. It operates independently from the Product Ordering API and is designed to handle order fulfillment processing.

## Functionality

The processor performs the following operations:

1. **Polling**: Every 5 seconds, queries MongoDB for orders to process
2. **Order Selection**: Fetches the oldest order (sorted by `orderDate`) where `state = "acknowledged"`
3. **State Transition**: Changes the order state to `"inProgress"`
4. **Processing**: Simulates order processing (takes approximately 10 seconds)
5. **Completion**: Updates the order state to `"completed"`

## Key Features

### Multi-Replica Safe Processing

The microservice uses MongoDB's atomic `findOneAndUpdate` operation to ensure that when multiple replicas are running, each order is processed exactly once. This prevents duplicate processing across replicas.

**How it works:**
- The processor uses `findOneAndUpdate` to atomically find and update an order's state from `"acknowledged"` to `"inProgress"`
- Only one replica will successfully update each order due to MongoDB's atomic operations
- Each processor identifies itself using the pod's hostname (available via the `HOSTNAME` environment variable)

### Processing Logic

The simulated processing includes:
- Order validation
- Inventory checks
- Resource allocation
- Provisioning scheduling
- Fulfillment system notifications
- Order record updates

Processing time: ~10 seconds per order

### Monitoring

The processor logs:
- Orders being processed (with order ID and date)
- Processing steps and progress
- Completion status
- Any errors encountered

## Configuration

### Environment Variables

- `MONGODB_HOST`: MongoDB hostname (default: `localhost`)
- `MONGODB_PORT`: MongoDB port (default: `27017`)
- `MONGODB_DATABASE`: Database name (default: `tmf`)
- `HOSTNAME`: Pod hostname (auto-set by Kubernetes)
- `NODE_ENV`: Node environment (default: `production`)

### Helm Configuration

In `values.yaml`:

```yaml
processor:
  image: lesterthomas/productorderprocessor:0.1
  versionLabel: productorderprocessor-0.1
  replicas: 2  # Number of processor replicas
```

## Deployment

The microservice is deployed as a Kubernetes Deployment with:
- Configurable number of replicas (default: 2)
- Resource limits and requests
- Connection to the component's MongoDB instance
- Automatic pod naming for tracking

## Building

Build the Docker image using:

```bash
cd source/ProductOrderCaptureAndValidation
docker buildx build -t "lesterthomas/productorderprocessor:0.1" \
  --platform "linux/amd64,linux/arm64" \
  -f productorderprocessor-dockerfile . --push
```

Or run the build script:

```bash
./builddockerfile.sh
```

## Development

### Local Testing

To run locally:

1. Ensure MongoDB is running
2. Set environment variables:
   ```bash
   export MONGODB_HOST=localhost
   export MONGODB_PORT=27017
   export MONGODB_DATABASE=tmf
   ```
3. Run the processor:
   ```bash
   cd productOrderProcessorMicroservice/implementation
   npm install
   npm start
   ```

### Dependencies

- `mongodb`: ^3.1.1 - MongoDB driver
- `dotenv`: ^16.3.1 - Environment variable management

## Architecture

```
┌─────────────────────────────────────┐
│  Product Ordering API               │
│  (Creates orders in "acknowledged") │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │   MongoDB    │
        │ "productorder"│
        └──────┬───────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ Processor   │  │ Processor   │
│ Replica 1   │  │ Replica 2   │
│             │  │             │
│ Polls every │  │ Polls every │
│ 5 seconds   │  │ 5 seconds   │
└─────────────┘  └─────────────┘
```

## Graceful Shutdown

The processor handles SIGTERM and SIGINT signals gracefully:
- Closes MongoDB connections
- Logs shutdown information
- Exits cleanly

## Order Processing States

```
acknowledged → inProgress → completed
```

- **acknowledged**: Order created by API, ready for processing
- **inProgress**: Order being processed by a processor replica
- **completed**: Order processing finished successfully
