# ProductOrderCaptureAndValidation Source Code

This is the Node.js reference implementation of the [TMFC002 — Product Order Capture And Validation](https://www.tmforum.org/oda/directory/components-map/core-commerce-management/TMFC002) ODA Component. For deployment instructions and configuration options, see the [Helm chart folder](../../charts/ProductOrderCaptureAndValidation/).

## Repository Structure

| Directory / File | Description |
|---|---|
| `productOrderingMicroservice/` | Node.js implementation of the TMF622 Product Ordering Management Open API |
| `roleInitializationMicroservice/` | Bootstraps the initial role (PermissionSpecificationSet or PartyRole) on first deploy |
| `productOrderInitializationMicroservice/` | Registers the metrics microservice as an event listener on first deploy |
| `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts TMF622 business events |
| `productordering-dockerfile` | Dockerfile for the TMF622 Product Ordering API microservice |
| `roleinitialization-dockerfile` | Dockerfile for the role initialization Job |
| `productorderinitialization-dockerfile` | Dockerfile for the product order initialization Job |
| `openMetricsMicroservice-dockerfile` | Dockerfile for the open metrics microservice |
| `builddockerfile.sh` | Script to build and push all Docker images to Docker Hub |

## Architecture Overview

The microservices interact as follows:

- The **productOrderingMicroservice** is the core API. It stores ProductOrder and CancelProductOrder resources in MongoDB. On order creation, it optionally validates product offerings against a downstream TMF620 Product Catalog API and creates product instances in a downstream TMF637 Product Inventory API. It publishes TMF622 business events to all registered listeners via the hub endpoint.
- The **productOrderInitializationMicroservice** runs as a one-shot Kubernetes Job on first deploy. It registers the open metrics microservice as a hub listener at `http://{componentName}-sm:4000/listener`.
- The **openMetricsMicroservice** receives event POSTs from the hub and increments a Prometheus counter labelled by event type. These metrics are scraped by the Canvas observability stack.
- The **roleInitializationMicroservice** runs as a one-shot Kubernetes Job on first deploy. It creates the initial `canvasRole` PermissionSpecificationSet (TMF672) or PartyRole (TMF669) needed by the Canvas for access control.
- The downstream integration with TMF620 (Product Catalog) and TMF637 (Product Inventory) is handled by `utils/downstreamAPI.js`, which discovers API URLs at runtime via the Canvas Info Service Inventory.

## productOrderingMicroservice Deep-Dive

The main API microservice lives in `productOrderingMicroservice/implementation/`.

| File / Folder | Description |
|---|---|
| `index.js` | Entry point — loads the TMF622 swagger spec, wires swagger-tools middleware (validator, router, swagger UI), starts HTTP server on port 8080 |
| `api/swagger.json` | TMF622 Product Ordering Management OpenAPI v4.0.0 spec — defines all routes and schemas |
| `controllers/ProductOrder.js` | Thin passthrough — maps TMF622 ProductOrder operationIds to `ProductOrderService` |
| `controllers/CancelProductOrder.js` | Thin passthrough — maps CancelProductOrder operationIds to `CancelProductOrderService` |
| `controllers/EventsSubscription.js` | Thin passthrough — maps hub register/unregister to `EventsSubscriptionService` |
| `controllers/NotificationListenersClientSide.js` | Thin passthrough — maps all 8 notification listener endpoints to `NotificationListenersClientSideService` |
| `service/ProductOrderService.js` | **Core business logic** — order validation against downstream Product Catalog, product creation in downstream Product Inventory, MongoDB CRUD, event publishing |
| `service/CancelProductOrderService.js` | MongoDB CRUD for CancelProductOrder resources |
| `service/EventsSubscriptionService.js` | Delegates hub register/unregister to `notificationUtils` |
| `service/NotificationListenersClientSideService.js` | Stub implementations for incoming notification listener endpoints |
| `utils/downstreamAPI.js` | Extended downstream API client — supports multiple named dependency URLs (parameterised by `dependencyName`) and both GET and POST operations |
| `utils/listResource.js` | Local-only list query (no downstream federation for orders) |
| `utils/retrieveResource.js` | Local-only retrieve by ID (no downstream federation for orders) |
| `utils/notificationUtils.js` | Hub subscription management and event dispatch to registered listeners |
| `utils/mongoUtils.js` | MongoDB connection and query helpers |
| `utils/swaggerUtils.js` | Swagger doc parsing and payload/type utilities |
| `utils/operationsUtils.js` | Common attribute processing (id, href, lastUpdate, @type) |
| `utils/errorUtils.js` | TError class and sendError helper |
| `utils/operations.js` | Assignment rules for resource state transitions |
| `utils/ruleUtils.js` | Request validation against declarative rules |
| `utils/rules.js` | Validation rule definitions for TMF resource types |
| `utils/entrypoint.js` | API root handler — returns JSON `_links` document |
| `utils/instrumentationUtil.js` | OpenTelemetry SDK setup (OTLP trace exporter) |
| `utils/writer.js` | Response writer utility |
| `config.json` | Runtime config — `{"strict_schema": true}` enables strict body validation |
| `package.json` | npm dependencies (swagger-tools, mongodb, axios, connect, etc.) |
| `index.html_replacement` | Swagger UI customisation — sets the default API spec URL to the TMF622 docs endpoint |

### Key Business Logic: Order Validation and Inventory Creation

`service/ProductOrderService.js` implements the TMFC002-specific flow on `createProductOrder`:

1. Extracts all `productOrderItem[].productOffering.id` values from the request.
2. Calls `retrieveFromDownstreamAPI('downstreamproductcatalog', 'productOffering', id)` for each — returns HTTP 422 if any offering is not found.
3. Sets `state: 'acknowledged'` and `orderDate` on the order, then persists it to MongoDB.
4. For each order item with `action: 'add'`, calls `createInDownstreamAPI('downstreamproductinventory', 'product', productPayload)` to create the product instance.
5. Publishes a `ProductOrderCreationNotification` event to registered listeners.

The two downstream dependency names (`downstreamproductcatalog` and `downstreamproductinventory`) are declared in the Component CRD and resolved at runtime by the Canvas into actual URLs, which are discovered via the Canvas Info Service Inventory API.

## Building Docker Images

From the `source/ProductOrderCaptureAndValidation/` directory:

```bash
bash builddockerfile.sh
```

Or build images individually:

```bash
docker buildx build -t "lesterthomas/productorderingapi:0.1" --platform "linux/amd64,linux/arm64" -f productordering-dockerfile . --push
docker buildx build -t "lesterthomas/roleinitialization:0.1" --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push
docker buildx build -t "lesterthomas/productorderinitialization:0.1" --platform "linux/amd64,linux/arm64" -f productorderinitialization-dockerfile . --push
docker buildx build -t "lesterthomas/productordercaptureandvalidationmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

> **Note**: `docker buildx` requires a multi-platform builder. If not already configured, run `docker buildx create --use --name multiarch-builder` first.

## Running Locally

To run the productOrderingMicroservice locally for development and testing:

1. Start a local MongoDB instance (e.g. via Docker):
   ```bash
   docker run -d -p 27017:27017 mongo:5.0.1
   ```

2. Install dependencies and start the server:
   ```bash
   cd productOrderingMicroservice/implementation
   npm install
   MONGODB_HOST=localhost MONGODB_PORT=27017 MONGODB_DATABASE=tmf COMPONENT_NAME=r1-productordercaptureandvalidation node index.js
   ```

3. The API will be available at `http://localhost:8080/r1-productordercaptureandvalidation/tmf-api/productOrderingManagement/v4/`

The Swagger UI is available at the `/docs` sub-path. When `CANVAS_INFO_HOST_PORT` is not set, the downstream API integration is skipped gracefully — orders are still accepted and stored, but no catalog validation or inventory creation occurs.
