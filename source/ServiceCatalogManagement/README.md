# Service Catalog Management Source Code

This is the Node.js reference implementation of the [TMFC006 Service Catalog Management](https://www.tmforum.org/oda/directory/components-map/production/TMFC006) ODA Component. For deployment instructions see the Helm chart at [../../charts/ServiceCatalogManagement](/charts/ServiceCatalogManagement/).

## Repository structure

| Directory / File | Description |
|---|---|
| `serviceCatalogMicroservice/` | Node.js implementation of the TMF633 Service Catalog Management Open API |
| `serviceQualityManagementMicroservice/` | Node.js implementation of the TMF657 Service Quality Management Open API |
| `processFlowMicroservice/` | Node.js implementation of the TMF701 Process Flow Management Open API (optional) |
| `roleInitializationMicroservice/` | Bootstraps the initial `canvasRole` on first deploy |
| `serviceCatalogInitializationMicroservice/` | Registers the metrics microservice as a hub listener on first deploy |
| `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts business events |
| `MCPServerMicroservice/` | Python/FastMCP server exposing the Service Catalog API as tools for AI agents |
| `svcatapi-dockerfile` | Dockerfile for the Service Catalog API microservice |
| `svcqualapi-dockerfile` | Dockerfile for the Service Quality Management API microservice |
| `procflowapi-dockerfile` | Dockerfile for the Process Flow Management API microservice |
| `roleinit-dockerfile` | Dockerfile for the role initialization job |
| `svcatinit-dockerfile` | Dockerfile for the Service Catalog initialization job |
| `openMetricsMicroservice-dockerfile` | Dockerfile for the open metrics microservice |
| `svcatmcp-dockerfile` | Dockerfile for the MCP server microservice |

## Architecture overview

The microservices interact as follows:

1. **serviceCatalogMicroservice** is the main API server. It receives REST calls, stores `ServiceCatalog`, `ServiceCategory`, `ServiceCandidate`, `ServiceSpecification`, `ExportJob`, and `ImportJob` documents in MongoDB, and publishes events to all registered listeners via `notificationUtils.publish()` on every create/patch/delete operation.

2. **serviceQualityManagementMicroservice** provides the TMF657 Service Quality Management API, storing quality-related resources in MongoDB.

3. **processFlowMicroservice** (optional) provides the TMF701 Process Flow Management API. Deployed only when `processflow.enabled=true` in the Helm chart.

4. **serviceCatalogInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs to the Service Catalog hub endpoint to register the metrics microservice as a listener. After registration it exits.

5. **openMetricsMicroservice** listens on `/listener` (POST) for events from the Service Catalog API. Each event increments a Prometheus counter (`{release}_servicecatalogmanagement_api_counter`). It also serves metrics at `/{componentName}/metrics` for Prometheus scraping.

6. **roleInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs an initial `canvasRole` to either the TMF672 PermissionSpecificationSet API or the TMF669 PartyRole API depending on the `USE_PERMISSION_SPEC` environment variable.

7. **MCPServerMicroservice** (optional) is a Python/FastMCP server that wraps the TMF633 Service Catalog API. It exposes tools for AI agents to perform CRUD operations on Service Catalog resources.

8. **MongoDB** is a shared document store used by all API microservices.

```
[Client] ──REST──► [serviceCatalogMicroservice] ──► [MongoDB]
                            │
                            │ publish events
                            ▼
                    [openMetricsMicroservice]
                    (registered via hub at startup by
                     serviceCatalogInitializationMicroservice)

[AI Agent] ──MCP──► [MCPServerMicroservice] ──REST──► [serviceCatalogMicroservice]
```

## Main API microservice

`serviceCatalogMicroservice/implementation/` contains:

| File / Folder | Description |
|---|---|
| `index.js` | Entry point — loads `api/swagger.yaml`, wires `swagger-ui`, registers `entrypointUtils.entrypoint` middleware, starts HTTP server on port 8080 |
| `api/swagger.yaml` | TMF633 OpenAPI spec — defines all routes, schemas, and `x-swagger-router-controller` annotations |
| `controllers/ServiceCatalog.js` | Thin passthrough — maps operationIds to `ServiceCatalogService` |
| `controllers/ServiceCategory.js` | Thin passthrough — maps operationIds to `ServiceCategoryService` |
| `controllers/ServiceCandidate.js` | Thin passthrough — maps operationIds to `ServiceCandidateService` |
| `controllers/ServiceSpecification.js` | Thin passthrough — maps operationIds to `ServiceSpecificationService` |
| `controllers/ExportJob.js` | Thin passthrough — maps operationIds to `ExportJobService` |
| `controllers/ImportJob.js` | Thin passthrough — maps operationIds to `ImportJobService` |
| `controllers/EventsSubscription.js` | Delegates `registerListener`/`unregisterListener` to `EventsSubscriptionService` |
| `controllers/NotificationListenersClientSide.js` | Delegates all event listener endpoints to `NotificationListenersClientSideService` |
| `service/` | Business logic — MongoDB CRUD, event publishing for each resource type |
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

The images are published to the `tmforumodacanvas` Docker Hub organization by the
[Build Component Images](../../.github/workflows/build-images.yml) workflow, which reads
[`dockerbuild-config.yaml`](../../dockerbuild-config.yaml):

| Image | Dockerfile |
|-------|------------|
| `tmforumodacanvas/servicecatalogapi:1.0.0` | `svcatapi-dockerfile` |
| `tmforumodacanvas/servicequalityapi:1.0.0` | `svcqualapi-dockerfile` |
| `tmforumodacanvas/processflowapi:1.0.0` | `procflowapi-dockerfile` |
| `tmforumodacanvas/servicecatalogmetrics:1.0.0` | `openMetricsMicroservice-dockerfile` |
| `tmforumodacanvas/servicecatalogmcp:1.0.0` | `svcatmcp-dockerfile` |
| `tmforumodacanvas/servicecataloginitialization:1.0.0` | `svcatinit-dockerfile` |
| `tmforumodacanvas/servicecatalogmanagement-roleinitialization:1.0.0` | `roleinit-dockerfile` |

To publish a change, bump the image's `version` in `dockerbuild-config.yaml` and in the chart's
`values.yaml`. The pull request builds the changed images, and merging it pushes them for
`linux/amd64` and `linux/arm64`. The workflow fails rather than overwrite an existing tag.

To build an image locally (from the repository root):

```bash
python scripts/images.py build servicecatalogapi
```

## Running a microservice locally

To run the Service Catalog API locally against a local MongoDB:

```bash
cd serviceCatalogMicroservice/implementation
npm install
MONGODB_HOST=localhost MONGODB_PORT=27017 MONGODB_DATABASE=tmf COMPONENT_NAME=r1-servicecatalogmanagement node index.js
```

The API will be available at `http://localhost:8080/r1-servicecatalogmanagement/tmf-api/serviceCatalog/v4/` with Swagger UI at `/r1-servicecatalogmanagement/tmf-api/serviceCatalog/v4/docs`.

## Extending the component

To add a new resource or operation:

1. Add the path and schema to `api/swagger.yaml`, setting `x-swagger-router-controller` to the controller name.
2. Create or update the controller in `controllers/` (thin passthrough).
3. Create or update the service in `service/` using the MongoDB promise chain pattern.
4. Rebuild the Docker image and push (`docker buildx build ...`).
5. Upgrade the Helm release (`helm upgrade r1 ../../charts/ServiceCatalogManagement -n components`).
