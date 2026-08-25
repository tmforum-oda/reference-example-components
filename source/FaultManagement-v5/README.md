# Fault Management Source Code

This is the Node.js reference implementation of the [TMFC043 Fault Management](https://www.tmforum.org/oda/directory/components-map/production/TMFC043) ODA Component. For deployment instructions see the Helm chart at [../../charts/FaultManagement-v5](/charts/FaultManagement-v5/).

## Repository structure

| Directory / File | Description |
|---|---|
| `faultmanagementMicroservice/` | Node.js implementation of the TMF642 Alarm Management Open API v5 |
| `faultmanagementInitializationMicroservice/` | Registers the metrics microservice as a hub listener on first deploy |
| `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts business events |
| `faultmanagement-dockerfile` | Dockerfile for the Alarm Management API microservice |
| `faultmanagementinitialization-dockerfile` | Dockerfile for the initialization job |
| `openMetricsMicroservice-dockerfile` | Dockerfile for the open metrics microservice |
| `builddockerfile.sh` | Script to build and push all Docker images to Docker Hub |

## Architecture overview

The microservices interact as follows:

1. **faultmanagementMicroservice** is the main API server. It receives REST calls, stores `Alarm`, `AckAlarm`, `UnAckAlarm`, `ClearAlarm`, `CommentAlarm`, `GroupAlarm` and `UnGroupAlarm` documents in MongoDB, and publishes events to all registered listeners on every create/patch/delete operation via the `EventsSubscription` hub.

2. **faultmanagementInitializationMicroservice** runs once as a Kubernetes Job on startup. It POSTs to the Alarm Management hub endpoint (`/tmf-api/alarmManagement/v5/hub`) to register the metrics microservice as a listener. After registration it exits.

3. **openMetricsMicroservice** listens on `/listener` (POST) for events from the Alarm Management API. Each event increments a Prometheus counter (`{release}_faultmanagement_api_counter`). It also serves metrics at `/{componentName}/metrics` for Prometheus scraping.

4. **MongoDB** is a shared document store used by the Alarm Management API.

```
[Client] ──REST──► [faultmanagementMicroservice] ──► [MongoDB]
                            │
                            │ publish events
                            ▼
                    [openMetricsMicroservice]
                    (registered via hub at startup by
                     faultmanagementInitializationMicroservice)
```

## Main API microservice

`faultmanagementMicroservice/implementation/` contains:

| File / Folder | Description |
|---|---|
| `index.js` | Entry point — wires plugins, launches `ExpressServer` |
| `expressServer.js` | Express server + `express-openapi-validator` — injects `COMPONENT_NAME` into `servers[0].url` at startup |
| `logger.js` | Winston logger |
| `config.js` / `config.json` | Runtime configuration (`strict_schema: false`, `QUERY_LIMIT: 250`) |
| `api/openapi.yaml` | TMF642 v5.0.1 OpenAPI spec — defines all routes, schemas, and `x-eov-operation-handler` annotations |
| `controllers/AlarmController.js` | Thin passthrough for the `alarm` resource (list/create/retrieve/patch/delete) |
| `controllers/AckAlarmController.js`, `ClearAlarmController.js`, `CommentAlarmController.js`, `GroupAlarmController.js`, `UnAckAlarmController.js`, `UnGroupAlarmController.js` | Thin passthroughs for the alarm action resources (list/create/retrieve) |
| `controllers/EventsSubscriptionController.js` | Delegates `createHub`/`hubGet`/`hubDelete` to `EventsSubscriptionService` |
| `controllers/NotificationListenerController.js` | Delegates all 16 client-listener endpoints to `NotificationListenerService` |
| `services/*Service.js` | Thin shells that set `classname`/`operationId`/`method` on the request context and delegate to the base `Service` class for MongoDB CRUD |
| `services/Service.js` | Base service engine — implements create/list/retrieve/patch/delete against MongoDB |
| `services/NotificationHandler.js` | Event notification stub |
| `plugins/mongo.js` | MongoDB connection plugin (`dbhost`/`dbport`/`dbname` env vars) |
| `utils/` | Shared utility files (see below) |

### Shared utilities (`utils/`)

| File | Purpose |
|---|---|
| `swaggerUtils.js` | Loads `openapi.yaml`, resolves `basePath` and response schema types |
| `operationsUtils.js` | `processCommonAttributes` (sets `id`, `href`, `lastUpdate`, `@type`, `@baseType`, `@schemaLocation`) |
| `operations.js` | `processAssignmentRules` — sets `@type` defaults on create for each resource |
| `ruleUtils.js` | `validateRequest` against `validationRulesType2` rules (unused — v5 relies on the base `Service` class) |
| `rules.js` | Per-resource validation rules (empty — optional in v5) |
| `entrypoint.js` | TMF630-compliant API entrypoint listing all operations as `_links` |
| `errorUtils.js` | `TError`/`TErrorEnum` structured error handling |
| `responseHeaders.js` | `X-Total-Count` / `X-Result-Count` / `Link` pagination headers |
| `conformanceUtils.js`, `jsonpath.js` | CTK conformance helpers |

## Building Docker images

From the `source/FaultManagement-v5/` directory:

```bash
bash builddockerfile.sh
```

Or individually:

```bash
docker buildx build -t "akumartmf/faultmanagementapiv5:0.1" --platform "linux/amd64,linux/arm64" -f faultmanagement-dockerfile . --push
docker buildx build -t "akumartmf/faultmanagementinitializationv5:0.1" --platform "linux/amd64,linux/arm64" -f faultmanagementinitialization-dockerfile . --push
docker buildx build -t "akumartmf/faultmanagementmetricsv5:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

> Multi-platform builds require a buildx builder. If not already set up: `docker buildx create --use --name multiarch-builder`

## Running the microservice locally

To run the Alarm Management API locally against a local MongoDB:

```bash
cd faultmanagementMicroservice/implementation
npm install
dbhost=localhost dbport=27017 dbname=tmf COMPONENT_NAME=r1-faultmanagement PORT=8080 node index.js
```

The API will be available at `http://localhost:8080/r1-faultmanagement/tmf-api/alarmManagement/v5/` with the OpenAPI docs UI at `/r1-faultmanagement/tmf-api/alarmManagement/v5/api-docs`.

## Extending the component

To add a new resource or operation:

1. Add the path and schema to `api/openapi.yaml`, setting `x-eov-operation-handler` to `controllers/{Resource}Controller`.
2. Create or update the controller in `controllers/` (thin passthrough to `Controller.handleRequest`).
3. Create or update the thin service shell in `services/` — set `classname`/`operationId`/`method` and delegate to `Service.serve()`.
4. Add any component-specific computed fields to `utils/operations.js`.
5. Rebuild the Docker image and push (`docker buildx build ...`).
6. Upgrade the Helm release (`helm upgrade r1 ../../charts/FaultManagement-v5 -n components`).
