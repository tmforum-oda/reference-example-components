# Source Templates

Reusable source code files bundled with the `create-oda-component` skill. These files are copied or used as reference patterns when generating a new ODA Component implementation.

## Directory Structure

```
templates/source/
├── utils/                                  # 14 shared Node.js utility files (copy verbatim)
├── index.html_replacement                  # Swagger UI customization (copy verbatim)
├── roleInitializationMicroservice/         # Role init job (copy verbatim)
├── openMetricsMicroservice/                # Metrics microservice (copy, customize counter name)
├── componentInitializationMicroservice/    # Component init job (use as reference, customize URL)
└── MCPServerMicroservice/                  # MCP server (use as reference, customize per component)
```

## Usage Guide

### `utils/` — Copy Verbatim

Contains 14 shared utility files used by every Node.js API microservice. Copy all of them unchanged into each new microservice's `utils/` directory.

| File | Purpose |
|------|---------|
| `mongoUtils.js` | MongoDB connection using `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE` env vars |
| `swaggerUtils.js` | Load swagger spec, extract types, manage payload schemas |
| `notificationUtils.js` | Publish events to hub subscriptions; `register`/`unregister` listener operations |
| `instrumentationUtil.js` | OpenTelemetry setup for tracing |
| `errorUtils.js` | `TError`/`TErrorEnum` structured error handling |
| `entrypoint.js` | TMF630-compliant API entrypoint listing all operations |
| `operationsUtils.js` | `setBaseProperties`, `traverse`, `addHref`, `processCommonAttributes` |
| `ruleUtils.js` | `validateRequest` against swagger schemas |
| `operations.js` | `processAssignmentRules` business logic hooks |
| `rules.js` | Assignment rules definitions |
| `listResource.js` | Standard list/filter/paginate operation |
| `retrieveResource.js` | Standard single resource retrieval |
| `downstreamAPI.js` | Call downstream dependent APIs |
| `writer.js` | Response writing helpers |

### `index.html_replacement` — Copy Verbatim

Replaces the default Swagger UI `index.html` to customise the UI for the component. Copy into each new microservice's `implementation/` directory alongside `index.js`.

### `roleInitializationMicroservice/` — Copy Verbatim

Kubernetes Job that creates the initial `canvasRole` on first deploy. Supports both TMF672 PermissionSpecificationSet and TMF669 PartyRole via the `USE_PERMISSION_SPEC` env var (set in the Helm chart). Copy `initialization.js` and `package.json` unchanged into `roleInitializationMicroservice/implementation/`.

### `openMetricsMicroservice/` — Copy, Customize Counter Name

Express server that listens for event notifications and exposes them as Prometheus counters. Copy `index.js` and `package.json` into `openMetricsMicroservice/`, then customize:
- Counter name: replace `{componentnamelower}_api_counter` with the new component name (use underscores, not hyphens — Prometheus metric names cannot contain hyphens)
- Counter description: reference the specific TMF API being monitored

### `componentInitializationMicroservice/` — Use as Reference, Customize URL

Reference implementation of the component initialization job (from ProductCatalog). Registers the metrics microservice as an event listener by POSTing to the main API's hub endpoint. When generating a new component, copy this and update:
- The hub URL to point to the new component's primary API service name and base path
- The service name in the callback URL to match the new component

### `MCPServerMicroservice/` — Use as Reference, Customize per Component

Reference MCP server implementation (from ProductCatalog) using Python/FastMCP with Streamable HTTP transport. Contains:
- `product_catalog_mcp_server.py` — FastMCP server with tool definitions for each resource CRUD operation
- `product_catalog_api.py` — async httpx API client
- `pyproject.toml` — Python dependencies

When generating a new component's MCP server, use these files as structural examples and rewrite them for the new component's resources and API paths. The server reads `RELEASE_NAME` and `COMPONENT_NAME` env vars to construct API URLs at runtime.
