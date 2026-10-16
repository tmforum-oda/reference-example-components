# ServiceOrderManagement Source Code

Node.js reference implementation of the TMFC007 Service Order Management ODA Component. For deployment, see the [chart folder](../../charts/ServiceOrderManagement/).

## Repository structure

| Directory | Description |
|-----------|-------------|
| `serviceOrderManagementMicroservice/` | Node.js implementation of the TMF641 Service Ordering Management Open API |
| `serviceOrderManagementInitializationMicroservice/` | Registers the metrics microservice as an event listener on first deploy |
| `roleInitializationMicroservice/` | Bootstraps the initial role (PermissionSpecificationSet or PartyRole) on first deploy |
| `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts business events |
| `serviceOrderManagementMCPServerMicroservice/` | Python/FastMCP MCP server for AI agent access to service order resources |
| `serviceordermanagement-dockerfile` | Dockerfile for the TMF641 API microservice |
| `serviceordermanagementinitialization-dockerfile` | Dockerfile for the initialization job |
| `roleinitialization-dockerfile` | Dockerfile for the role initialization job |
| `openMetricsMicroservice-dockerfile` | Dockerfile for the metrics microservice |
| `serviceordermanagement-mcp-dockerfile` | Dockerfile for the MCP server |

## Architecture overview

The main API microservice (`serviceOrderManagementMicroservice`) stores service orders and cancel service orders in MongoDB and publishes events to registered listeners via the `/hub` endpoint. The initialization job (`serviceOrderManagementInitializationMicroservice`) registers the metrics microservice as a listener at startup. The metrics microservice receives events and increments Prometheus counters. The role initialization job creates the initial role in the permission/partyrole API on startup.

## Main API microservice deep-dive

`serviceOrderManagementMicroservice/implementation/`

| File/Folder | Description |
|-------------|-------------|
| `index.js` | Entry point — loads swagger, wires middleware, starts HTTP server |
| `api/swagger.yaml` | OpenAPI spec — defines all routes and schemas for TMF641 |
| `controllers/` | Thin passthrough — maps swagger operationIds to service functions |
| `service/` | Business logic — MongoDB CRUD, event publishing |
| `utils/` | Shared utilities (mongoUtils, notificationUtils, swaggerUtils, etc.) |
| `config.json` | Runtime config (`strict_schema: true`) |
| `package.json` | npm dependencies |

**Controllers:**
- `ServiceOrder.js` — CRUD for serviceOrder (list, create, retrieve, patch, delete)
- `CancelServiceOrder.js` — list, create, retrieve cancelServiceOrder
- `EventsSubscription.js` — registerListener, unregisterListener (delegates to notificationUtils)
- `NotificationListenersClientSide.js` — client-side listener endpoints for all event types

## Building Docker images

The images are published to the `tmforumodacanvas` Docker Hub organization by the
[Build Component Images](../../.github/workflows/build-images.yml) workflow, which reads
[`dockerbuild-config.yaml`](../../dockerbuild-config.yaml):

| Image | Dockerfile |
|-------|------------|
| `tmforumodacanvas/serviceorderapi:1.0.0` | `serviceordermanagement-dockerfile` |
| `tmforumodacanvas/serviceordermanagementmetrics:1.0.0` | `openMetricsMicroservice-dockerfile` |
| `tmforumodacanvas/serviceordermanagementmcp:1.0.0` | `serviceordermanagement-mcp-dockerfile` |
| `tmforumodacanvas/serviceordermanagementinitialization:1.0.0` | `serviceordermanagementinitialization-dockerfile` |
| `tmforumodacanvas/serviceordermanagement-roleinitialization:1.0.0` | `roleinitialization-dockerfile` |

To publish a change, bump the image's `version` in `dockerbuild-config.yaml` and in the chart's
`values.yaml`. The pull request builds the changed images, and merging it pushes them for
`linux/amd64` and `linux/arm64`. The workflow fails rather than overwrite an existing tag.

To build an image locally (from the repository root):

```bash
python scripts/images.py build serviceorderapi
```

## Running locally

To run the API microservice locally for testing:

1. Start a local MongoDB: `docker run -d -p 27017:27017 mongo:5.0.1`
2. Set environment variables: `COMPONENT_NAME=r1-serviceordermanagement`, `MONGODB_HOST=localhost`
3. `cd serviceOrderManagementMicroservice/implementation && npm install && npm start`
4. Access Swagger UI at `http://localhost:8080/r1-serviceordermanagement/tmf-api/serviceOrdering/v4/docs`
