---
name: create-oda-component
description: >
  Build a complete TM Forum ODA Component implementation from scratch, including Node.js microservice source code, Dockerfiles, and Kubernetes Helm charts. Use this skill whenever the user wants to:
  - Create, build, scaffold, implement, or generate an ODA Component
  - Build an implementation for a standard TMForum component (TMFC001 through TMFC062)
  - Generate source code and/or Helm charts following the ODA Component standard
  - Ask "how do I build TMFC006?" or "I want to implement Service Catalog Management"
  Invoke whenever you see: "create ODA component", "build TMForum component", "scaffold TMFC", "implement ODA", "new ODA component", or any mention of TMFCxxx component codes.
---

# Create ODA Component

A standalone skill for building complete TM Forum ODA Component implementations. All reference patterns and reusable template files are bundled within this skill in the `templates/` directory, so the skill can be installed in any repository.

## What you will build

For each new component you generate:
1. **Source code** (`source/{ComponentName}/`) — Node.js microservices for each exposed API, plus initialization jobs and a metrics microservice
2. **Helm chart** (`charts/{ComponentName}/`) — Kubernetes manifests including the ODA Component CRD, API deployments, MongoDB, services, jobs, and PVC

Before starting, read these reference files as needed:
- `references/component-list.md` — Full list of ODA Components and spec URL pattern
- `references/source-patterns.md` — Source code structure, Node.js patterns, dockerfiles
- `references/chart-patterns.md` — Helm chart structure and template patterns

Template files bundled in this skill:
- `templates/source/utils/` — 14 shared Node.js utility files (copy verbatim into every microservice)
- `templates/source/index.html_replacement` — Swagger UI customization file
- `templates/source/roleInitializationMicroservice/` — Role init job implementation (copy verbatim)
- `templates/source/openMetricsMicroservice/` — Metrics microservice implementation (customize counter name)
- `templates/source/componentInitializationMicroservice/` — Component init job reference (customize API URL)
- `templates/source/MCPServerMicroservice/` — MCP server reference implementation (customize per component)
- `templates/charts/templates/deployment-rolemanagement.yaml` — Conditional role management deployment template
- `templates/charts/README.md` — Chart README reference example

---

## Step 1 — Component Selection

Ask the user which ODA Component they want to build. Read `references/component-list.md` and present the full table of ~35 components so the user can choose by code (e.g. `TMFC006`) or name (e.g. "Service Catalog Management").

Once the user picks a component, fetch the official specification YAML:
```
https://raw.githubusercontent.com/tmforum-rand/TMForum-ODA-Ready-for-publication/v1.0.0/{CODE}-{ShortName}/Specification/{CODE}-{ShortName}.yaml
```

Parse the fetched YAML to understand:
- `spec.componentMetadata` — id, name, description, functionalBlock, publicationDate
- `spec.coreFunction.exposedAPIs` — APIs the component exposes (check `required` field)
- `spec.coreFunction.dependentAPIs` — APIs the component consumes
- `spec.securityFunction.exposedAPIs` — Security API (typically TMF672 PermissionSpecificationSet)
- `spec.managementFunction.exposedAPIs` — Management API (typically open metrics)
- `spec.eventNotification` — Published and subscribed events

---

## Step 2 — API Selection

Identify which exposed APIs are mandatory (`required: true`) and which are optional (`required: false`).

**Always implement:**
- All mandatory exposed APIs (`required: true` in the spec's `coreFunction.exposedAPIs`)
- The security API — use the existing shared **`lesterthomas/permissionspecapi:0.20`** (TMF672 PermissionSpecificationSet) image. This is the standard for all components. 
- The management API (open metrics — use a component-specific tag, e.g. `lesterthomas/{componentnamelower}metrics:0.1`)

**Ask the user about each optional API:**
> "The specification includes these optional exposed APIs. Which would you like to implement?
> - [ ] {API name} ({TMFXXX}) — {short description from spec}
> - [ ] {API name} ({TMFXXX}) — ..."

Also ask:
> "Would you also like to generate an MCP server microservice for AI agent access to this component's APIs? (Following the Python/FastMCP pattern from ProductCatalog)"

Note which APIs the user selects — this determines what microservices and Helm templates to generate.

---

## Step 3 — Gather Docker Registry Info

Ask the user for their Docker Hub namespace (or container registry) for the new images:
> "What Docker Hub username or container registry namespace should I use for the new images? (e.g. `myorg`)"

This is used in `builddockerfile.sh` and `values.yaml`.

---

## Step 4 — Generate Source Code

Read `references/source-patterns.md` for all patterns before generating files.

Create `source/{ComponentName}/` with this structure:

### 4a — For each selected exposed API (including mandatory ones)

Create `{apiname}Microservice/implementation/` with:

**`api/swagger.yaml`** — Download the OpenAPI spec from the URL in the specification YAML's `specification[0].url` field. Save it as `swagger.yaml`. This is the spec the Node.js server loads at startup.
- Always use YAML format. Never use JSON (`swagger.json`) — `swaggerUtils.js` reads `swagger.yaml` exclusively.
- Always remove the `host:` field from the downloaded spec (delete the line entirely). Leaving `host` undefined causes swagger-ui to use the current page's host, which is correct behaviour when the API is accessed through the ODA Canvas ingress at `localhost`. A hardcoded value such as `serverRoot` or any other placeholder will cause swagger-ui to show a wrong Base URL.
- After downloading, add `x-swagger-router-controller` to every operation in the spec. Map each operation's first tag to the corresponding PascalCase controller filename (e.g. tag `productOrder` → controller `ProductOrder`). This is required because Linux's case-sensitive filesystem cannot match a lowercase tag name to a PascalCase `.js` file. Without this field, `swagger-tools` will fail at runtime with `Cannot resolve the configured swagger-router handler`. The mapping pattern is: take the tag, split on spaces (for multi-word tags), PascalCase each word, join — e.g. `events subscription` → `EventsSubscription`, `notification listeners (client side)` → `NotificationListenersClientSide`.

**`index.js`** — Follow the exact pattern from `references/source-patterns.md`. Key customizations:
- Set `componentName` default to `r1-{componentnamelower}` for local testing
- The swagger basePath comes from the downloaded swagger spec
- Always register the entrypoint after swagger-ui: `app.use(swaggerDoc.basePath, entrypointUtils.entrypoint)` — this provides a JSON `_links` document at the API root
- Always use `swagger-ui-dist` for the swagger UI (pass `apiDocs`, `swaggerUi`, and `swaggerUiDir` to `middleware.swaggerUi()`)
- Always use the `TError`/`sendError` error handler pattern (not a simple `res.end` handler)

**`controllers/{Resource}.js`** — One file per resource defined in the swagger spec. Use the thin-passthrough pattern. Inspect the swagger spec's `paths` to identify which resources exist and which CRUD operations each supports.

**`service/{Resource}Service.js`** — One file per resource. Implement all CRUD operations defined in the swagger spec using the MongoDB promise chain pattern from `references/source-patterns.md`. Use `listResource` / `retrieveResource` utilities for GET operations.

**Critical**: `registerListener` and `unregisterListener` must **always** delegate to `notificationUtils.register(req, res, next)` and `notificationUtils.unregister(req, res, next)` respectively — never use the generic CRUD pattern for these. This ensures hub subscriptions are stored in the `HUB` collection that `notificationUtils.publish` reads from when dispatching events to registered listeners.

**`utils/`** — Copy all 14 utility files from `templates/source/utils/` (bundled in this skill) verbatim into each microservice. These are shared utilities that work across any TMF API.

**`package.json`** — Follow the pattern from `references/source-patterns.md`, updating `name` and `description` to match the specific API (e.g. `"name": "service-catalog-management"`, `"description": "TMF API Reference: TMF633 - Service Catalog Management"`).

**`config.json`** — `{"strict_schema": true}`

**`index.html_replacement`** — Copy from `templates/source/index.html_replacement` (bundled in this skill)

### 4b — Role Initialization Microservice

Create `roleInitializationMicroservice/implementation/` using the pattern from `references/source-patterns.md`. This is identical across all components — copy from `templates/source/roleInitializationMicroservice/` (bundled in this skill). The `initialization.js` supports both TMF669 and TMF672 via the `USE_PERMISSION_SPEC` env var.

### 4c — Open Metrics Microservice

Create `openMetricsMicroservice/` using the pattern from `references/source-patterns.md`. This is nearly identical across all components — customize:
- Counter name: `{componentnamelower}_api_counter` — **Important**: Prometheus metric names must match `[a-zA-Z_:][a-zA-Z0-9_:]*` (no hyphens). Always derive the metric name by replacing hyphens with underscores: `const metricName = componentName.replace(/-/g, '_');` then use `metricName + '_api_counter'`. The `COMPONENT_NAME` env var at runtime is typically `{release}-{componentname}` (e.g. `pi1-productinventory`), which contains hyphens.
- Description: reference the specific TMF API being monitored

### 4d — Dockerfiles

Create one dockerfile per microservice following the `FROM node:16 / COPY / WORKDIR / RUN npm install / EXPOSE 8080 / CMD` pattern.

Use `FROM node:10.19` for roleInitializationMicroservice and openMetricsMicroservice (no port expose for role init).

### 4e — MCP Server (if user requested)

Follow the Python/FastMCP pattern from `templates/source/MCPServerMicroservice/` (bundled in this skill — the `product_catalog_mcp_server.py` and `product_catalog_api.py` are ProductCatalog-specific examples to use as reference). Create:
- `{componentname}MCPServerMicroservice/{componentname}_mcp_server.py` — FastMCP server with tools for each resource CRUD operation
- `{componentname}MCPServerMicroservice/{componentname}_api.py` — httpx async API client
- `{componentname}MCPServerMicroservice/pyproject.toml` — Python dependencies (fastmcp, httpx, uvicorn)
- `{componentname}-mcp-dockerfile` — `FROM python:3.13`, `RUN pip install .`, `CMD python {componentname}_mcp_server.py`

### 4f — Build Script

Create `builddockerfile.sh` listing `docker buildx build` commands for all new images, using multi-platform `linux/amd64,linux/arm64` builds. Follow the pattern from `references/source-patterns.md`.

**Important naming rule for metrics image**: Use a component-specific tag (e.g. `{dockerhub-namespace}/{componentname}metrics:0.1`) rather than the shared `openmetrics:1.0` tag to avoid overwriting the ProductCatalog image. Update `values.yaml` `metrics.image` to match.

**Do not include a `permissionspecapi` or `partyroleapi` build** in `builddockerfile.sh` — both use pre-built shared images (`lesterthomas/permissionspecapi:0.20` and `lesterthomas/partyroleapi:1.1`) with no source dockerfile in this directory.

---

## Step 5 — Generate Helm Chart

Read `references/chart-patterns.md` for all patterns before generating templates.

Create `charts/{ComponentName}/`:

### Chart.yaml

Fill in `name` (lowercase component name), `description` mentioning the component code and name, `version: 1.0.0`.

### values.yaml

Fill in from the parsed specification YAML:
- `component.id` — from `componentMetadata.id`
- `component.name` — lowercase component name
- `component.functionalBlock` — from `componentMetadata.functionalBlock`
- `component.publicationDate` — from `componentMetadata.publicationDate`
- `api.image` — `{dockerhub-namespace}/{componentname}api:0.1`
- `permissionspec.image: lesterthomas/permissionspecapi:0.20`, `permissionspec.enabled: true` — always default to permissionspec
- `partyrole.image: lesterthomas/partyroleapi:1.1` — kept for reference but `permissionspec.enabled: true` means it won't be used
- Add sections for each optional API that was selected (e.g. `promotionmgmt.image`, `promotionmgmt.enabled: false`)

### templates/component-{componentname}.yaml (the ODA Component CRD)

This is the most important template. Build it from the fetched specification YAML:

1. `spec.componentMetadata` — pull description, functionalBlock, id, name from the spec
2. `spec.coreFunction.exposedAPIs` — add each selected API with proper `gatewayConfiguration` block using `{{.Values.component.apipolicy.*}}` Helm template expressions
3. For optional APIs, wrap in `{{- if .Values.{optionalapi}.enabled }}` conditional
4. For MCP server, wrap in `{{- if .Values.component.MCPServer.enabled }}`
5. `spec.coreFunction.dependentAPIs` — wrap in `{{- if .Values.component.dependentAPIs.enabled }}` conditional with `{{- else }}` that outputs `[]`
6. `spec.managementFunction` — standard open metrics block
7. `spec.securityFunction` — conditional TMF672 block using `{{- if .Values.permissionspec.enabled }}`

**Critical**: Every path must use `{{.Release.Name}}-{{.Values.component.name}}` as the prefix. The API path should follow the pattern: `/{release}-{componentname}/tmf-api/{apiPath}/v{n}`.

### templates/ (remaining templates)

Generate the following, following `references/chart-patterns.md` patterns exactly:
- `deployment-{primary-api}api.yaml` — customize `startupProbe` path to a real endpoint of that API
- `deployment-mongodb.yaml` — standard, copy pattern verbatim
- `deployment-metricsapi.yaml` — standard, copy pattern verbatim
- `deployment-rolemanagement.yaml` — conditional permissionspec/partyrole
- `service-{primary-api}api.yaml` — NodePort service for each API
- `service-mongodb.yaml` — standard MongoDB service
- `service-registerallevents.yaml` — metrics service (port 4000, selector: metricsapi)
- `service-rolemanagement.yaml` — conditional service (permissionspecapi or partyroleapi)
- `job-roleinitialization.yaml` — standard role init job (uses lesterthomas/roleinitialization:0.1)
- `job-{componentname}initialization.yaml` — component-specific init job
- `persistentVolumeClaim-mongodb.yaml` — standard 5Gi PVC

For each optional API that the user chose to include, add corresponding `deployment-{optionalapi}api.yaml` and `service-{optionalapi}api.yaml` templates (conditional on `{{- if .Values.{optionalapi}.enabled }}`).

---

## Step 6 — Verify

After generation, run:
```bash
helm lint charts/{ComponentName}/
```

Fix any lint errors before finishing. Common issues:
- Missing required values in `values.yaml` that templates reference
- Port name string too long (Kubernetes limit is 15 characters)
- Indentation errors in generated YAML

---

## Step 7 — Build and Push Docker Images

After helm lint passes, build and push all Docker images. Run from the `source/{ComponentName}/` directory:

```bash
cd source/{ComponentName}/
bash builddockerfile.sh
```

Or run each command individually to monitor build output per image:

```bash
cd source/{ComponentName}/
docker buildx build -t "{dockerhub-namespace}/{componentnamelower}api:0.1" --platform "linux/amd64,linux/arm64" -f {componentnamelower}-dockerfile . --push
docker buildx build -t "{dockerhub-namespace}/{componentnamelower}initialization:0.1" --platform "linux/amd64,linux/arm64" -f {componentnamelower}initialization-dockerfile . --push
docker buildx build -t "{dockerhub-namespace}/{componentnamelower}metrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

Wait for each build to complete and confirm the push succeeded (`pushing manifest for docker.io/...` in the output).

> **Note**: `docker buildx` requires a multi-platform builder. If not already set up, run `docker buildx create --use --name multiarch-builder` first.

### Multi-Arch Build Reliability

Multi-platform builds can sometimes stall during the registry push phase despite successful local builds. If you encounter `--push` hanging indefinitely or manifest errors:

1. **Add `--provenance=false` flag** to all `docker buildx build` commands. This reduces manifest complexity and improves registry upload reliability:
   ```bash
   docker buildx build -t "{namespace}/{image}:0.1" --platform "linux/amd64,linux/arm64" -f {dockerfile} . --push --provenance=false
   ```

2. **For persistent push failures**, use the per-architecture workaround:
   ```bash
   # Build separate tags for each architecture
   docker buildx build -t "{namespace}/{image}:0.1-amd64" --platform linux/amd64 -f {dockerfile} . --push --provenance=false
   docker buildx build -t "{namespace}/{image}:0.1-arm64" --platform linux/arm64 -f {dockerfile} . --push --provenance=false
   
   # Compose multi-arch manifest from per-arch images
   docker buildx imagetools create -t {namespace}/{image}:0.1 {namespace}/{image}:0.1-amd64 {namespace}/{image}:0.1-arm64
   ```
   Single-platform pushes are more reliable than multi-platform `--push`, and `imagetools create` assembles the final manifest atomically.

3. **Verify successful push** by inspecting the manifest:
   ```bash
   docker buildx imagetools inspect {namespace}/{image}:0.1
   ```
   Both `linux/amd64` and `linux/arm64` manifests should be listed.

---

## Step 8 — Generate README Files

### Chart README (`charts/{ComponentName}/README.md`)

Model this on `templates/charts/README.md` (bundled in this skill). Include:

1. **Title and intro** — `# Example {ComponentName} component` with a one-line description linking to the TM Forum component directory page.

2. **Functionality section** — describe each function area:
   - **Core function** — list mandatory and optional exposed APIs, and any dependent APIs. For each optional feature, show the `--set` override to enable it:
     ```
     helm install <release name> oda-components/{componentnamelower} --set {feature}.enabled=true -n components
     ```
   - **Management function** — describe the open metrics endpoint and what business events are counted, mention Open Telemetry tracing with the OTLP config snippet from `values.yaml`.
   - **Security function** — describe the conditional TMF672/TMF669 role management with `permissionspec.enabled`.

3. **Microservices list** — bullet list of all microservices deployed, one line each describing what they do.

4. **Installation section** — step-by-step:
   ```
   helm install r1 .\{componentnamelower} -n components
   ```
   Show the `kubectl get components -n components` verification command and expected output with `DEPLOYMENT_STATUS: Complete`.

5. **Configuration table** — Markdown table of all configurable `values.yaml` keys with columns `Variable Name`, `Default`, `Explanation`. Cover at minimum:
   - `mongodb.port`, `mongodb.database`
   - `api.image`
   - `api.otlp.console.enabled`, `api.otlp.protobuffCollector.enabled`, `api.otlp.protobuffCollector.url`
   - `metrics.image`
   - `permissionspec.enabled`
   - Any component-specific optional API flags (e.g. `promotionmgmt.enabled`)

---

### Source README (`source/{ComponentName}/README.md`)

Create a new file explaining the source code structure for developers who want to understand or extend it. Include:

1. **Title and intro** — `# {ComponentName} Source Code` — explain this is the Node.js reference implementation of the ODA component, and link to the chart folder for deployment.

2. **Repository structure** — a tree or table listing each top-level directory with a one-line description:
   | Directory | Description |
   |-----------|-------------|
   | `{componentname}Microservice/` | Node.js implementation of the TMF{xxx} {API Name} Open API |
   | `roleInitializationMicroservice/` | Bootstraps the initial role (PermissionSpecificationSet or PartyRole) on first deploy |
   | `{componentname}InitializationMicroservice/` | Registers the metrics microservice as an event listener on first deploy |
   | `openMetricsMicroservice/` | Prometheus/OpenMetrics endpoint that counts business events |
   | `*-dockerfile` | Dockerfile for each microservice |
   | `builddockerfile.sh` | Script to build and push all Docker images |

3. **Architecture overview** — a short paragraph describing how the microservices interact:
   - The main API microservice stores data in MongoDB and publishes events to registered listeners via the hub endpoint.
   - The initialization job registers the metrics microservice as a listener.
   - The metrics microservice receives events and increments Prometheus counters.
   - The role initialization job creates the initial role in the permission/partyrole API on startup.

4. **Main API microservice deep-dive** (`{componentname}Microservice/implementation/`) — describe the layout:
   | File/Folder | Description |
   |-------------|-------------|
   | `index.js` | Entry point — loads swagger, wires middleware, starts HTTP server |
   | `api/swagger.yaml` | OpenAPI spec — defines all routes and schemas |
   | `controllers/` | Thin passthrough — maps swagger operationIds to service functions |
   | `service/` | Business logic — MongoDB CRUD, event publishing |
   | `utils/` | Shared utilities (mongoUtils, notificationUtils, swaggerUtils, etc.) |
   | `config.json` | Runtime config (strict_schema: true) |
   | `package.json` | npm dependencies |

5. **Building Docker images** — show commands:
   ```bash
   cd source/{ComponentName}/
   bash builddockerfile.sh
   ```
   Or individually per image. Note the multi-platform build requires `docker buildx`.

6. **Running locally** (optional guidance) — briefly describe how a developer could run a single microservice locally for testing with a local MongoDB instance.

---

## Step 9 — Summary

Tell the user what was created, what they need to do next:

1. **Deploy**: `helm install r1 charts/{ComponentName}/ -n components`
2. **Verify**: `kubectl get components -n components` — expect `DEPLOYMENT_STATUS: Complete`

---

## Key Rules

- **Never** hardcode the Helm release name in templates. Always use `{{.Release.Name}}`.
- **Always** put the `oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}` label on every Kubernetes resource.
- **Follow the spec**: The mandatory/optional distinction in `exposedAPIs[].required` must be respected — always implement `required: true` APIs, always ask about `required: false` APIs.
- **Security API** (`securityFunction.exposedAPIs`) is always implemented — use the existing shared role management implementation images unless the user wants custom ones.
- **OpenAPI spec URLs**: Get them from `exposedAPIs[].specification[0].url` in the specification YAML. The swagger spec must be downloaded and saved as `api/swagger.yaml` in each microservice.
- **Naming consistency**: The Kubernetes service name for each API becomes the hostname for inter-service communication. It must match the `implementation` field in the Component CRD and the selector in the Service template.
- **Docker Buildx multi-arch**: Always use `--provenance=false` on multi-platform builds. If standard multi-platform `--push` stalls, use per-arch `--push` followed by `docker buildx imagetools create` to compose the final manifest.
