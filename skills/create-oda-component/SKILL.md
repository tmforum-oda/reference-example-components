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

A skill for building complete TM Forum ODA Component implementations, following the patterns established in the `source/ProductCatalog/` and `charts/ProductCatalog/` reference examples.

## What you will build

For each new component you generate:
1. **Source code** (`source/{ComponentName}/`) — Node.js microservices for each exposed API, plus initialization jobs and a metrics microservice
2. **Helm chart** (`charts/{ComponentName}/`) — Kubernetes manifests including the ODA Component CRD, API deployments, MongoDB, services, jobs, and PVC

Before starting, read these reference files as needed:
- `references/component-list.md` — Full list of ODA Components and spec URL pattern
- `references/source-patterns.md` — Source code structure, Node.js patterns, dockerfiles
- `references/chart-patterns.md` — Helm chart structure and template patterns

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
- The management API (open metrics — use existing `lesterthomas/openmetrics:1.0` image)

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

**`index.js`** — Follow the exact pattern from `references/source-patterns.md`. Key customizations:
- Set `componentName` default to `r1-{componentnamelower}` for local testing
- The swagger basePath comes from the downloaded swagger spec
- Always register the entrypoint after swagger-ui: `app.use(swaggerDoc.basePath, entrypointUtils.entrypoint)` — this provides a JSON `_links` document at the API root
- Always use `swagger-ui-dist` for the swagger UI (pass `apiDocs`, `swaggerUi`, and `swaggerUiDir` to `middleware.swaggerUi()`)
- Always use the `TError`/`sendError` error handler pattern (not a simple `res.end` handler)

**`controllers/{Resource}.js`** — One file per resource defined in the swagger spec. Use the thin-passthrough pattern. Inspect the swagger spec's `paths` to identify which resources exist and which CRUD operations each supports.

**`service/{Resource}Service.js`** — One file per resource. Implement all CRUD operations defined in the swagger spec using the MongoDB promise chain pattern from `references/source-patterns.md`. Use `listResource` / `retrieveResource` utilities for GET operations.

**Critical**: `registerListener` and `unregisterListener` must **always** delegate to `notificationUtils.register(req, res, next)` and `notificationUtils.unregister(req, res, next)` respectively — never use the generic CRUD pattern for these. This ensures hub subscriptions are stored in the `HUB` collection that `notificationUtils.publish` reads from when dispatching events to registered listeners.

**`utils/`** — Copy all 14 utility files from `source/ProductCatalog/productCatalogMicroservice/implementation/utils/` verbatim into each microservice. These are shared utilities that work across any TMF API.

**`package.json`** — Follow the pattern from `references/source-patterns.md`, updating `name` and `description` to match the specific API (e.g. `"name": "service-catalog-management"`, `"description": "TMF API Reference: TMF633 - Service Catalog Management"`).

**`config.json`** — `{"strict_schema": true}`

**`index.html_replacement`** — Copy from `source/ProductCatalog/productCatalogMicroservice/implementation/index.html_replacement`

### 4b — Role Initialization Microservice

Create `roleInitializationMicroservice/implementation/` using the pattern from `references/source-patterns.md`. This is identical across all components — copy from `source/ProductCatalog/roleInitializationMicroservice/`. The `initialization.js` supports both TMF669 and TMF672 via the `USE_PERMISSION_SPEC` env var.

### 4c — Open Metrics Microservice

Create `openMetricsMicroservice/` using the pattern from `references/source-patterns.md`. This is nearly identical across all components — customize:
- Counter name: `{componentnamelower}_api_counter`
- Description: reference the specific TMF API being monitored

### 4d — Dockerfiles

Create one dockerfile per microservice following the `FROM node:16 / COPY / WORKDIR / RUN npm install / EXPOSE 8080 / CMD` pattern.

Use `FROM node:10.19` for roleInitializationMicroservice and openMetricsMicroservice (no port expose for role init).

### 4e — MCP Server (if user requested)

Follow the Python/FastMCP pattern from `source/ProductCatalog/MCPServerMicroservice/`. Create:
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
- `job-roleinitialization.yaml` — standard role init job (uses lesterthomas/roleinitialization:0.6)
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

---

## Step 8 — Summary

Tell the user what was created, what they need to do next:

1. **Copy utils**: Copy all files from `source/ProductCatalog/productCatalogMicroservice/implementation/utils/` into each new microservice's `utils/` folder
2. **Download swagger specs**: The `api/swagger.yaml` in each microservice needs the actual OpenAPI spec from the URL in the specification YAML
3. **Deploy**: `helm install r1 charts/{ComponentName}/`

---

## Key Rules

- **Never** hardcode the Helm release name in templates. Always use `{{.Release.Name}}`.
- **Always** put the `oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}` label on every Kubernetes resource.
- **Follow the spec**: The mandatory/optional distinction in `exposedAPIs[].required` must be respected — always implement `required: true` APIs, always ask about `required: false` APIs.
- **Security API** (`securityFunction.exposedAPIs`) is always implemented — use the existing shared role management implementation images unless the user wants custom ones.
- **OpenAPI spec URLs**: Get them from `exposedAPIs[].specification[0].url` in the specification YAML. The swagger spec must be downloaded and saved as `api/swagger.yaml` in each microservice.
- **Naming consistency**: The Kubernetes service name for each API becomes the hostname for inter-service communication. It must match the `implementation` field in the Component CRD and the selector in the Service template.
