# Product Inventory Source Code

This is the Node.js reference implementation of the [TMFC005 Product Inventory Management](https://www.tmforum.org/oda/directory/components-map/core-commerce-management/TMFC005) ODA Component. For deployment instructions see the Helm chart at [../../charts/ProductInventory](/charts/ProductInventory/).

## Repository structure

| Directory / File | Description |
|---|---|
| `productInventoryMicroservice/` | Node.js implementation of the TMF637 Product Inventory Management Open API |
| `roleInitializationMicroservice/` | Bootstraps the initial `canvasRole` on first deploy |
| `productInventoryInitializationMicroservice/` | Registers the metrics microservice as a hub listener on first deploy |
| `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts business events |
| `productinventory-dockerfile` | Dockerfile for the Product Inventory API microservice |
| `roleinitialization-dockerfile` | Dockerfile for the role initialization job |
| `productinventoryinitialization-dockerfile` | Dockerfile for the Product Inventory initialization job |
| `openMetricsMicroservice-dockerfile` | Dockerfile for the open metrics microservice |
| `builddockerfile.sh` | Script to build and push all Docker images to Docker Hub |

## Architecture overview

The microservices interact as follows:

1. **productInventoryMicroservice** is the main API server. It receives REST calls, stores `Product` documents in MongoDB, and publishes events to all registered listeners via `notificationUtils.publish()` on every create/patch/delete operation.

2. **productInventoryInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs to the Product Inventory hub endpoint (`/tmf-api/productInventory/v4/hub`) to register the metrics microservice as a listener. After registration it exits.

3. **openMetricsMicroservice** listens on `/listener` (POST) for events from the Product Inventory API. Each event increments a Prometheus counter (`{release}_productinventory_api_counter`). It also serves metrics at `/{componentName}/metrics` for Prometheus scraping.

4. **roleInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs an initial `canvasRole` to either the TMF672 PermissionSpecificationSet API or the TMF669 PartyRole API depending on the `USE_PERMISSION_SPEC` environment variable.

5. **MongoDB** is a shared document store used by the Product Inventory API and the role management microservice.

```
[Client] ──REST──► [productInventoryMicroservice] ──► [MongoDB]
                            │
                            │ publish events
                            ▼
                    [openMetricsMicroservice]
                    (registered via hub at startup by
                     productInventoryInitializationMicroservice)
```

## Main API microservice

`productInventoryMicroservice/` contains:

| File / Folder | Description |
|---|---|
| `index.js` | Entry point — loads `api/swagger.yaml`, wires `swagger-ui`, registers `entrypointUtils.entrypoint` middleware, starts HTTP server on port 8080 |
| `api/swagger.yaml` | TMF637 OpenAPI spec — defines all routes, schemas, and `x-swagger-router-controller` annotations |
| `controllers/Product.js` | Thin passthrough — maps operationIds to `ProductService` |
| `controllers/EventsSubscription.js` | Delegates `registerListener`/`unregisterListener` to `EventsSubscriptionService` |
| `controllers/NotificationListenersClientSide.js` | Delegates all event listener endpoints to `NotificationListenersClientSideService` |
| `service/ProductService.js` | MongoDB CRUD for Product — publishes events on create/patch/delete |
| `service/EventsSubscriptionService.js` | Delegates to `notificationUtils.register` / `notificationUtils.unregister` |
| `service/NotificationListenersClientSideService.js` | Inserts incoming event payloads into MongoDB and re-publishes |
| `utils/` | 14 shared utility files (see below) |
| `config.json` | `{"strict_schema": true}` |
| `package.json` | npm dependencies |

### Shared utilities (`utils/`)

These 14 files are identical across all reference components — they are copied verbatim from the `templates/source/utils/` directory in the `create-oda-component` skill:

| File | Purpose |
|---|---|
| `mongoUtils.js` | MongoDB connection and `sendDoc` helper |
| `notificationUtils.js` | `publish`, `register`, `unregister` for hub-based event dispatch |
| `swaggerUtils.js` | Loads `swagger.yaml`, provides `getPayload`, `getPayloadSchema`, `updatePayloadServiceType` |
| `listResource.js` | Generic list (GET collection) with filtering and field selection |
| `retrieveResource.js` | Generic retrieve (GET by id) |
| `operationsUtils.js` | `traverse`, `processCommonAttributes`, `addHref` |
| `operations.js` | `processAssignmentRules` |
| `ruleUtils.js` | `validateRequest` |
| `rules.js` | Schema rule definitions |
| `entrypoint.js` | Middleware that returns a `_links` document at the API root |
| `errorUtils.js` | `TError`, `TErrorEnum`, `sendError` |
| `writer.js` | HTTP response helpers |
| `downstreamAPI.js` | Helpers for calling dependent APIs |
| `instrumentationUtil.js` | OpenTelemetry instrumentation setup |

## Building Docker images

From the `source/ProductInventory/` directory:

```bash
bash builddockerfile.sh
```

Or individually:

```bash
docker buildx build -t "lesterthomas/productinventoryapi:0.4" --platform "linux/amd64,linux/arm64" -f productinventory-dockerfile . --push
docker buildx build -t "lesterthomas/productinventoryinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productinventoryinitialization-dockerfile . --push
docker buildx build -t "lesterthomas/productinventorymetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

> Multi-platform builds require a buildx builder. If not already set up: `docker buildx create --use --name multiarch-builder`

## Running a microservice locally

To run the Product Inventory API locally against a local MongoDB:

```bash
cd productInventoryMicroservice
npm install
MONGODB_HOST=localhost MONGODB_PORT=27017 MONGODB_DATABASE=tmf COMPONENT_NAME=r1-productinventory node index.js
```

The API will be available at `http://localhost:8080/r1-productinventory/tmf-api/productInventory/v4/` with Swagger UI at `/r1-productinventory/tmf-api/productInventory/v4/docs`.

## Extending the component

To add a new resource or operation:

1. Add the path and schema to `api/swagger.yaml`, setting `x-swagger-router-controller` to the controller name.
2. Create or update the controller in `controllers/` (thin passthrough).
3. Create or update the service in `service/` using the MongoDB promise chain pattern.
4. Rebuild the Docker image and push (`docker buildx build ...`).
5. Upgrade the Helm release (`helm upgrade r1 ../../charts/ProductInventory -n components`).
