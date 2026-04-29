# Party Management Source Code

This is the Node.js reference implementation of the [TMFC028 Party Management](https://www.tmforum.org/oda/directory/components-map/party-management/TMFC028) ODA Component. For deployment instructions see the Helm chart at [../../charts/PartyManagement](/charts/PartyManagement/).

## Repository structure

| Directory / File | Description |
|---|---|
| `partyManagementMicroservice/` | Node.js implementation of the TMF632 Party Management Open API |
| `roleInitializationMicroservice/` | Bootstraps the initial `canvasRole` on first deploy |
| `partyManagementInitializationMicroservice/` | Registers the metrics microservice as a hub listener on first deploy |
| `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts business events |
| `partymanagement-dockerfile` | Dockerfile for the Party Management API microservice |
| `roleinitialization-dockerfile` | Dockerfile for the role initialization job |
| `partymanagementinitialization-dockerfile` | Dockerfile for the initialization job |
| `openMetricsMicroservice-dockerfile` | Dockerfile for the open metrics microservice |
| `builddockerfile.sh` | Script to build and push all Docker images to Docker Hub |

## Architecture overview

The microservices interact as follows:

1. **partyManagementMicroservice** is the main API server. It receives REST calls, stores `Individual` and `Organization` documents in MongoDB, and publishes events to all registered listeners via `notificationUtils.publish()` on every create/patch/delete operation.

2. **partyManagementInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs to the Party Management hub endpoint (`/tmf-api/party/v4/hub`) to register the metrics microservice as a listener. After registration it exits.

3. **openMetricsMicroservice** listens on `/listener` (POST) for events from the Party Management API. Each event increments a Prometheus counter (`{release}_partymanagement_api_counter`). It also serves metrics at `/{componentName}/metrics` for Prometheus scraping.

4. **roleInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs an initial `canvasRole` to either the TMF672 PermissionSpecificationSet API or the TMF669 PartyRole API depending on the `USE_PERMISSION_SPEC` environment variable.

5. **MongoDB** is a shared document store used by the Party Management API and the role management microservice.

```
[Client] ──REST──► [partyManagementMicroservice] ──► [MongoDB]
                            │
                            │ publish events
                            ▼
                    [openMetricsMicroservice]
                    (registered via hub at startup by
                     partyManagementInitializationMicroservice)
```

## Main API microservice

`partyManagementMicroservice/implementation/` contains:

| File / Folder | Description |
|---|---|
| `index.js` | Entry point — loads `api/swagger.yaml`, wires `swagger-ui`, registers `entrypointUtils.entrypoint` middleware, starts HTTP server on port 8080 |
| `api/swagger.yaml` | TMF632 OpenAPI spec — defines all routes, schemas, and `x-swagger-router-controller` annotations |
| `controllers/Individual.js` | Thin passthrough — maps operationIds to `IndividualService` |
| `controllers/Organization.js` | Thin passthrough — maps operationIds to `OrganizationService` |
| `controllers/EventsSubscription.js` | Delegates `registerListener`/`unregisterListener` to `EventsSubscriptionService` |
| `controllers/NotificationListenersClientSide.js` | Delegates all 8 event listener endpoints to `NotificationListenersClientSideService` |
| `service/IndividualService.js` | MongoDB CRUD for Individual — publishes events on create/patch |
| `service/OrganizationService.js` | MongoDB CRUD for Organization — publishes events on create/patch |
| `service/EventsSubscriptionService.js` | Delegates to `notificationUtils.register` / `notificationUtils.unregister` |
| `service/NotificationListenersClientSideService.js` | Inserts incoming event payloads into MongoDB and re-publishes |
| `utils/` | 14 shared utility files (see below) |
| `config.json` | `{"strict_schema": true}` |
| `package.json` | npm dependencies |

### Shared utilities (`utils/`)

These 14 files are identical across all reference components — they are copied verbatim from `source/ProductCatalog/productCatalogMicroservice/implementation/utils/`:

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

From the `source/PartyManagement/` directory:

```bash
bash builddockerfile.sh
```

Or individually:

```bash
docker buildx build -t "lesterthomas/partymanagementapi:0.1" --platform "linux/amd64,linux/arm64" -f partymanagement-dockerfile . --push
docker buildx build -t "lesterthomas/partymanagementinitialization:0.1" --platform "linux/amd64,linux/arm64" -f partymanagementinitialization-dockerfile . --push
docker buildx build -t "lesterthomas/partymanagementmetrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

> Multi-platform builds require a buildx builder. If not already set up: `docker buildx create --use --name multiarch-builder`

## Running a microservice locally

To run the Party Management API locally against a local MongoDB:

```bash
cd partyManagementMicroservice/implementation
npm install
MONGODB_HOST=localhost MONGODB_PORT=27017 MONGODB_DATABASE=tmf COMPONENT_NAME=r1-partymanagement node index.js
```

The API will be available at `http://localhost:8080/r1-partymanagement/tmf-api/party/v4/` with Swagger UI at `/r1-partymanagement/tmf-api/party/v4/docs`.

## Extending the component

To add a new resource or operation:

1. Add the path and schema to `api/swagger.yaml`, setting `x-swagger-router-controller` to the controller name.
2. Create or update the controller in `controllers/` (thin passthrough).
3. Create or update the service in `service/` using the MongoDB promise chain pattern.
4. Rebuild the Docker image and push (`docker buildx build ...`).
5. Upgrade the Helm release (`helm upgrade r1 ../../charts/PartyManagement -n components`).
