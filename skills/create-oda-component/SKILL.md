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
- `templates/source/utils/` — 14 shared Node.js utility files (copy verbatim into every V4 microservice)
- `templates/source-v5/` — V5 infrastructure files (copy verbatim for OpenAPI 3.x APIs): `index.js`, `expressServer.js`, `logger.js`, `config.js`, `controllers/Controller.js`, `services/Service.js`, `services/NotificationHandler.js`, `plugins/plugins.js`, `plugins/mongo.js`, and all files under `utils/`
- `templates/source/index.html_replacement` — Swagger UI customization file (V4 only)
- `templates/source/roleInitializationMicroservice/` — Role init job implementation (copy verbatim)
- `templates/source/openMetricsMicroservice/` — Metrics microservice implementation (customize counter name)
- `templates/source/componentInitializationMicroservice/` — Component init job reference (customize API URL)
- `templates/source/MCPServerMicroservice/` — MCP server reference implementation (customize per component)
- `templates/charts/templates/deployment-rolemanagement.yaml` — Conditional role management deployment template (optional — only used when user confirms roleInitializationMicroservice in Step 2)
- `templates/charts/README.md` — Chart README reference example

---

## Step 1 — Component Selection

Ask the user which ODA Component they want to build. Read `references/component-list.md` and present the full table of ~35 components so the user can choose by code (e.g. `TMFC006`) or name (e.g. "Service Catalog Management").

Once the user picks a component, resolve the specification YAML using this priority order:

**1. Local specs folder (preferred)** — Check `skills/create-oda-component/specs/` for a file matching the component code or name (e.g. `TMFC001-ProductCatalogManagement.yaml`). If found, use it directly without any network requests.

**2. Internet download (fallback)** — Only if the specs folder does not exist or contains no matching file, fetch from:
```
https://raw.githubusercontent.com/tmforum-rand/TMForum-ODA-Ready-for-publication/v1.1.0/{CODE}-{ShortName}/Specification/{CODE}-{ShortName}.yaml
```
If this URL returns a 404, fetch the directory listing to find the correct folder name before retrying:
```
https://api.github.com/repos/tmforum-rand/TMForum-ODA-Ready-for-publication/contents/?ref=v1.1.0
```

Parse the fetched YAML to understand:
- `spec.componentMetadata` — id, name, description, functionalBlock, publicationDate
- `spec.coreFunction.exposedAPIs` — APIs the component exposes (check `required` field)
- `spec.coreFunction.dependentAPIs` — APIs the component consumes
- `spec.securityFunction.exposedAPIs` — Security API declarations (default: empty — only populate if the user explicitly requests TMF672 or TMF669 exposure)
- `spec.managementFunction.exposedAPIs` — Management API (typically open metrics)
- `spec.eventNotification` — Published and subscribed events

---

## Step 2 — API Selection and Version Detection

Identify which exposed APIs are mandatory (`required: true`) and which are optional (`required: false`).

**Default generation mode** — Unless the user specifies otherwise, apply these defaults so generation can proceed without stalling:
- Include only mandatory APIs (`required: true`); skip optional APIs
- Disable MCP server
- Use `{your-dockerhub-namespace}` as a placeholder Docker registry namespace (user fills in before building)
- When multiple API versions are available, automatically select the highest version

The user can override any of these at any point.

**Always implement:**
- All mandatory exposed APIs (`required: true` in the spec's `coreFunction.exposedAPIs`)
- The management API (open metrics — use a component-specific tag, e.g. `lesterthomas/{componentnamelower}metrics:0.1`)
- Role management infrastructure (permissionspecapi deployment, service, and roleinitialization job) — **only generated when the user confirms roleInitializationMicroservice in Step 2**. By default, no role management pods are deployed.

**Ask the user about each optional API:**
> "The specification includes these optional exposed APIs. Which would you like to implement?
> - [ ] {API name} ({TMFXXX}) — {short description from spec}
> - [ ] {API name} ({TMFXXX}) — ..."

Also ask:
> "Would you also like to generate an MCP server microservice for AI agent access to this component's APIs? (Following the Python/FastMCP pattern from ProductCatalog)"

And ask:
> "Would you like to generate a `roleInitializationMicroservice`? This bootstraps an initial canvas role in the permissionspec/partyrole API when the component is first deployed. If omitted (the default), the component uses a static canvas role via `canvasSystemRole` only — no dynamic role initialization is performed.
> **Default: No**"

Record all answers — they determine what microservices, Dockerfiles, and Helm templates to generate. If the user confirms roleInitializationMicroservice, generate the source, Dockerfile, AND the corresponding Helm templates (`deployment-rolemanagement.yaml`, `service-rolemanagement.yaml`, `job-roleinitialization.yaml`). If not confirmed, generate none of those.

**Multi-version resolution** — Before fetching any spec, inspect the `specification` field for each selected API. In newer component specifications (v1.1.0+), `specification` is an array and may contain multiple entries representing different API versions, for example:

```yaml
    exposedAPIs:
    - id: TMF620
      name: product-catalog-management-api
      apiSDO: tmForum
      required: true
      specification:
      - version: v5.0.0
        apiType: openapi
        url: https://tmf-open-api-table-documents.s3.eu-west-1.amazonaws.com/OpenApiTable/TMF620_Product_Catalog/5.0.0/swagger/TMF620-Product_Catalog_Management-v5.0.0.oas.yaml
        resources:
        - productCatalog:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - category:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - exportJob:
          - GET
          - GET /id
          - POST
          - DELETE
        - importJob:
          - GET
          - GET /id
          - POST
          - DELETE
        - productOffering:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - productOfferingPrice:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - productSpecification:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        path: not_defined
        developerUI: not_defined
        implementation: not_defined
        port: 8080
      - version: v4.1.0
        apiType: openapi
        url: https://tmf-open-api-table-documents.s3.eu-west-1.amazonaws.com/OpenApiTable/TMF620_Product_Catalog/4.1.0/swagger/TMF620_Product_Catalog_Management_API_v4.1.0_swagger.json
        resources:
        - catalog:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - category:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - productSpecification:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - productOffering:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - productOfferingPrice:
          - GET
          - GET /id
          - POST
          - PATCH
          - DELETE
        - exportJob:
          - POST
          - GET
          - GET /id
          - DELETE
        - importJob:
          - POST
          - GET
          - GET /id
          - DELETE
        path: not_defined
        developerUI: not_defined
        implementation: not_defined
        port: 8080
```

If an API's `specification` array contains **more than one entry**, you must ask the user which version to use **before** fetching the spec or generating any code for that API:

> "The {API name} ({TMFXXX}) specification lists multiple versions. Which version should I generate?
> 1. {version} — {url}
> 2. {version} — {url}
> ..."

Wait for the user's answer for each multi-version API before continuing. Only proceed with the user-confirmed version. Record the selected URL and use it everywhere `specification[0].url` is referenced in the steps below.

If `specification` has only one entry (or is a scalar string), use it without asking.

**API Version Detection** — For each selected API, fetch the resolved specification URL and detect the OpenAPI version by reading the first line of the YAML:
- `swagger: "2.0"` → **V4**: use the connect + swagger-tools patterns (from `templates/source/utils/`)
- `openapi: "3.x.x"` → **V5**: use the express + express-openapi-validator patterns (from `templates/source-v5/`)

Record the detected version per API — different APIs within the same component may use different versions. The correct template set must be used throughout Steps 4a–4h for each API.

Read `references/source-patterns.md` § "V5 API Patterns" for all v5-specific patterns before generating any v5 microservice.

---

## Step 3 — Gather Docker Registry Info

Ask the user for their Docker Hub namespace (or container registry) for the new images:
> "What Docker Hub username or container registry namespace should I use for the new images? (e.g. `myorg`)"

This is used in `builddockerfile.sh` and `values.yaml`.

---

## Step 4 — Generate Source Code

Read `references/source-patterns.md` for all patterns before generating files.

### Source of Truth Rules

These rules apply throughout all of Step 4. Violating them is the primary cause of hallucinated or mismatched code:

- **OpenAPI spec is authoritative for operations** — Before generating any controller or service file, extract every `operationId` from the downloaded spec. That list is complete and exclusive — it defines exactly what to implement.
- **Controller exports must match operationIds exactly** — Each exported function name in a controller file must be the exact `operationId` string from the spec. Do not add, rename, or infer operations from resource names or patterns.
- **Services reflect controllers 1:1** — Generate a service file only for resource types that have at least one operationId in the spec. Do not generate service files for resource types not present.
- **Count check** — After generating controllers, verify that the total number of exported functions across all controllers equals the total number of operations in the spec. If they differ, reconcile before continuing.
- **Do not infer from examples** — Never generate an operation based on what similar TMF APIs expose, what other components do, or common CRUD conventions. Use only what the downloaded spec defines.

Create `source/{ComponentName}/` with this structure:

### 4a — For each selected exposed API (including mandatory ones)

Create `{apiname}Microservice/implementation/` with:

**Determine API version first** (from Step 2 detection), then follow the correct branch:

---

#### Branch A: V4 API (`swagger: "2.0"`)

**`api/swagger.yaml`** — Resolve the API spec using this priority order:
1. **Local specs folder (preferred)** — Check `skills/create-oda-component/specs/` for a `.yaml` or `.json` file matching the API id or name (e.g. `TMF622*.yaml`). If found, use it directly.
2. **Internet download (fallback)** — Only if no matching file is found locally, download from the user-selected specification URL (recorded in Step 2).

Save as `swagger.yaml`.
- Always use YAML format. Never use JSON — `swaggerUtils.js` reads `swagger.yaml` exclusively.
- Remove the `host:` field from the downloaded spec entirely.
- Add `x-swagger-router-controller` to every operation, mapping each operation's first tag to its PascalCase controller filename (e.g. tag `productOrder` → `ProductOrder`, tag `events subscription` → `EventsSubscription`). Required because `swagger-tools` uses this to route operations on Linux case-sensitive filesystems.

**`index.js`** — Follow the V4 pattern from `references/source-patterns.md` (connect + swagger-tools). Set `componentName` default to `r1-{componentnamelower}`.

**`utils/`** — Copy all files from `templates/source/utils/` verbatim.

**`controllers/{Resource}.js`** — One file per resource, thin-passthrough to service. Include only operations defined in the spec.

**`service/{Resource}Service.js`** — One file per resource with inline CRUD. Key rules:
- **list and retrieve must be implemented inline** (not delegated to `listResource.js`/`retrieveResource.js`) — inline patterns correctly set `X-Total-Count`, `X-Result-Count`, and `Link` headers.
- **create must call `processCommonAttributes`** — sets mandatory response attributes (`id`, `href`, `lastUpdate`, `@type`, `@baseType`, `@schemaLocation`). Without it the API fails the OpenAPI CTK.
- **patch must NOT call `processCommonAttributes` or `processAssignmentRules`** — create-only.
- **`registerListener`/`unregisterListener` must delegate to `notificationUtils`** — never use the CRUD pattern for these.

**`package.json`** — Follow V4 pattern from `references/source-patterns.md`.

**`config.json`** — `{"strict_schema": true}`

---

#### Branch B: V5 API (`openapi: "3.x.x"`)

**`api/openapi.yaml`** — Resolve the API spec using this priority order:
1. **Local specs folder (preferred)** — Check `skills/create-oda-component/specs/` for a `.yaml` or `.json` file matching the API id or name (e.g. `TMF620*.yaml`). If found, use it directly.
2. **Internet download (fallback)** — Only if no matching file is found locally, download from the user-selected specification URL (recorded in Step 2).

Save as `openapi.yaml`.
- Add `x-eov-operation-handler: controllers/{Resource}Controller` to every operation in the spec. This is the v5 equivalent of `x-swagger-router-controller`. The handler path is relative to the project root (e.g. `controllers/CatalogController`).
- Do NOT add a `host:` field — v5 uses `servers[0].url` which is modified at runtime.
- Remove any hardcoded `servers[0].url` host+port — the `expressServer.js` template will inject the correct `COMPONENT_NAME` prefix at startup.

**Infrastructure files** — Copy these verbatim from `templates/source-v5/`:
- `index.js`, `expressServer.js`, `logger.js`, `config.js`
- `controllers/Controller.js`
- `services/Service.js`, `services/NotificationHandler.js`
- `plugins/plugins.js`, `plugins/mongo.js`
- All files from `templates/source-v5/utils/`

**`controllers/{Resource}Controller.js`** — One file per resource. Use the V5 controller pattern from `references/source-patterns.md` (sets context, delegates to `Controller.handleRequest`). Each exported function name must exactly match the `operationId` in the spec.

**`services/{Resource}Service.js`** — One file per resource. Use the V5 thin shell pattern from `references/source-patterns.md` (sets `classname`, `operationId`, `method` on context, calls `Service.serve()`). All CRUD logic is handled by the base `Service` class — do not add custom logic here.

**`package.json`** — Follow V5 pattern from `references/source-patterns.md`.

**`config.json`** — `{"strict_schema": false, "QUERY_LIMIT": 250}`

### 4g — V4 Only: Add Validation Rules to rules.js

*Skip this step for V5 APIs — express-openapi-validator handles request validation.*

For V4 APIs: update `utils/rules.js` to add a `validationRulesType2` entry for each resource type exposed by the component. Follow the pattern in `references/source-patterns.md` (Validation Rules section). The rules ensure that the incoming POST payload contains all required sub-object fields — without them, the API may accept malformed payloads that fail the CTK.

To determine what rules to add: inspect the swagger definition for the resource. Any field in the schema marked `required: true`, especially nested objects and arrays with their own required sub-fields, needs a corresponding rule.

### 4h — Dependent API Href Validation

**Decision trigger**: Check the component spec's `coreFunction.dependentAPIs` for any entry with `required: true`. If any mandatory dependent API exists, ask the user for the validation scenario. If all dependent APIs are optional (`required: false`), skip this step entirely.

**Ask the user:**
> "The component has a mandatory dependency on {API name} ({TMFXXX}). Should I validate references to {API name} resources in incoming payloads?
> If yes, please tell me:
> 1. Which operation triggers validation (e.g. POST /organization)
> 2. The location of the id/href in the payload (e.g. `relatedParty.href`)
> 3. A sample payload showing where the field appears"

**Validation contract** (apply to every validator built):
- If the field is absent from the payload → **skip validation and continue** (no error)
- If the field is present as an array → iterate each entry; skip entries where `href`/`id` is absent
- If a discriminator field (e.g. `@referredType`) filters which entries apply → only validate matching entries
- If the href/id is present but the GET returns non-200 or network error → reject with HTTP 422 (`TErrorEnum.UNPROCESSABLE_ENTITY`)

For each field the user confirms:
1. Add `axios` to `package.json` dependencies if not already present
2. Add an `async validate{FieldName}Href(payload)` function to `utils/ruleUtils.js` — use the scalar or array+conditional pattern from `references/source-patterns.md` (Dependent API Href Validation section) as appropriate
3. Export the new function from `ruleUtils.js`
4. Wire it into the service using the correct approach for the API version:
   - **V4**: import and chain after `processAssignmentRules` in the `.then()` create chain (see **V4** pattern in source-patterns.md)
   - **V5**: override only the `create{Resource}` function in the thin service shell with the pre-validation pattern and the corrected catch handler (see **V5** pattern in source-patterns.md) — do NOT use the standard `e.message || 'Invalid input'` catch handler, it strips TError status codes

If the user confirms no validation is needed, skip this step.

### 4b — Role Initialization Microservice (conditional)

**Only generate this section if the user confirmed roleInitializationMicroservice in Step 2.**

Create `roleInitializationMicroservice/implementation/` using the pattern from `references/source-patterns.md`. This is identical across all components — copy from `templates/source/roleInitializationMicroservice/` (bundled in this skill). The `initialization.js` supports both TMF669 and TMF672 via the `USE_PERMISSION_SPEC` env var.

If the user did **not** confirm roleInitializationMicroservice, skip this section entirely — do not create the directory, Dockerfile, or any Helm templates for role management.

### 4c — Open Metrics Microservice

Create `openMetricsMicroservice/` using the pattern from `references/source-patterns.md`. This is nearly identical across all components — customize:
- Counter name: `{componentnamelower}_api_counter` — **Important**: Prometheus metric names must match `[a-zA-Z_:][a-zA-Z0-9_:]*` (no hyphens). Always derive the metric name by replacing hyphens with underscores: `const metricName = componentName.replace(/-/g, '_');` then use `metricName + '_api_counter'`. The `COMPONENT_NAME` env var at runtime is typically `{release}-{componentname}` (e.g. `pi1-productinventory`), which contains hyphens.
- Description: reference the specific TMF API being monitored

### 4d — Dockerfiles

Create one dockerfile per microservice following the `FROM node:16 / COPY / WORKDIR / RUN npm install / EXPOSE 8080 / CMD` pattern.

Use `FROM node:10.19` for openMetricsMicroservice and (if generated) roleInitializationMicroservice (no port expose for role init).

**Only generate `roleinitialization-dockerfile` if roleInitializationMicroservice was confirmed in Step 2.** If not confirmed, omit that Dockerfile entirely.

### 4e — MCP Server (if user requested)

Follow the Python/FastMCP pattern from `templates/source/MCPServerMicroservice/` (bundled in this skill — the `product_catalog_mcp_server.py` and `product_catalog_api.py` are ProductCatalog-specific examples to use as reference). Create:
- `{componentname}MCPServerMicroservice/{componentname}_mcp_server.py` — FastMCP server with tools for each resource CRUD operation
- `{componentname}MCPServerMicroservice/{componentname}_api.py` — httpx async API client
- `{componentname}MCPServerMicroservice/pyproject.toml` — Python dependencies (fastmcp, httpx, uvicorn)
- `{componentname}-mcp-dockerfile` — `FROM python:3.13`, `RUN pip install .`, `CMD python {componentname}_mcp_server.py`

### 4f — Build Script

Create `builddockerfile.sh` listing `docker buildx build` commands for all new images, using multi-platform `linux/amd64,linux/arm64` builds. Follow the pattern from `references/source-patterns.md`.

**Important naming rule for metrics image**: Use a component-specific tag (e.g. `{dockerhub-namespace}/{componentname}metrics:0.1`) rather than the shared `openmetrics:1.0` tag to avoid overwriting the ProductCatalog image. Update `values.yaml` `metrics.image` to match.

**Only include the `roleinitialization` build line if roleInitializationMicroservice was confirmed in Step 2.** If not confirmed, omit that line from `builddockerfile.sh`.

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
- Add sections for each optional API that was selected (e.g. `promotionmgmt.image`, `promotionmgmt.enabled: false`)
- **Only if user confirmed roleInitializationMicroservice in Step 2**: add `permissionspec.image: lesterthomas/permissionspecapi:0.20`, `permissionspec.enabled: true`, and `partyrole.image: lesterthomas/partyroleapi:1.1`

### templates/component-{componentname}.yaml (the ODA Component CRD)

This is the most important template. Build it from the fetched specification YAML:

1. `spec.componentMetadata` — pull description, functionalBlock, id, name from the spec
2. `spec.coreFunction.exposedAPIs` — add each selected API with proper `gatewayConfiguration` block using `{{.Values.component.apipolicy.*}}` Helm template expressions
3. For optional APIs, wrap in `{{- if .Values.{optionalapi}.enabled }}` conditional
4. For MCP server, wrap in `{{- if .Values.component.MCPServer.enabled }}`
5. `spec.coreFunction.dependentAPIs` — apply the mandatory/optional distinction from the component spec:
   - **Mandatory** (`required: true`) — include unconditionally, one entry per API with `name`, `id`, `apiType: openapi`, and `specification[0].url` (highest version). Never wrap these in a conditional.
   - **Optional** (`required: false`) — wrap each in its own `{{- if .Values.component.{optionaldep}.enabled }}` conditional with `{{- else }}` that outputs `[]` 
   - If the component has no dependent APIs at all, use `dependentAPIs: []`.
6. `spec.managementFunction` — standard open metrics block
7. `spec.securityFunction` — `canvasSystemRole: {{ .Values.security.canvasSystemRole }}` with `exposedAPIs: []` by default. Only add a TMF672 or TMF669 entry here if the user explicitly asks to expose the security API in the component spec.

**Critical**: Every path must use `{{.Release.Name}}-{{.Values.component.name}}` as the prefix. The API path should follow the pattern: `/{release}-{componentname}/tmf-api/{apiPath}/v{n}`.

### templates/ (remaining templates)

Generate the following, following `references/chart-patterns.md` patterns exactly:
- `deployment-{primary-api}api.yaml` — customize `startupProbe` path to a real endpoint of that API
- `deployment-mongodb.yaml` — standard, copy pattern verbatim
- `deployment-metricsapi.yaml` — standard, copy pattern verbatim
- `service-{primary-api}api.yaml` — NodePort service for each API
- `service-mongodb.yaml` — standard MongoDB service
- `service-registerallevents.yaml` — metrics service (port 4000, selector: metricsapi)
- `job-{componentname}initialization.yaml` — component-specific init job
- `persistentVolumeClaim-mongodb.yaml` — standard 5Gi PVC

**Only if the user confirmed roleInitializationMicroservice in Step 2**, also generate:
- `deployment-rolemanagement.yaml` — conditional permissionspec/partyrole deployment
- `service-rolemanagement.yaml` — conditional service (permissionspecapi or partyroleapi)
- `job-roleinitialization.yaml` — role init job (uses lesterthomas/roleinitialization:0.6)

For each optional API that the user chose to include, add corresponding `deployment-{optionalapi}api.yaml` and `service-{optionalapi}api.yaml` templates (conditional on `{{- if .Values.{optionalapi}.enabled }}`).

---

## Step 6 — Verify

### Syntax check (Node.js)

For each generated microservice, run a syntax check before building Docker images:
```bash
node --check source/{ComponentName}/{apiname}Microservice/implementation/index.js
```

Fix any syntax errors before proceeding to helm lint or Docker builds.

### Helm lint

Run:
```bash
helm lint charts/{ComponentName}/
```

Fix any lint errors before finishing. Common issues:
- Missing required values in `values.yaml` that templates reference
- Port name string too long (Kubernetes limit is 15 characters)
- Indentation errors in generated YAML

---

## Step 7 — Build Docker Images

After verification passes, present the following build commands to the user. **Do not execute them** — image building and pushing requires the user's Docker credentials and is their responsibility to run.

Replace `{your-dockerhub-namespace}` with the user's actual registry namespace before presenting.

```bash
# Run from source/{ComponentName}/
# Requires: docker buildx create --use --name multiarch-builder (if not already set up)

docker buildx build -t "{your-dockerhub-namespace}/{componentnamelower}api:0.1" --platform "linux/amd64,linux/arm64" -f {componentnamelower}-dockerfile . --push
docker buildx build -t "{your-dockerhub-namespace}/{componentnamelower}initialization:0.1" --platform "linux/amd64,linux/arm64" -f {componentnamelower}initialization-dockerfile . --push
docker buildx build -t "{your-dockerhub-namespace}/{componentnamelower}metrics:0.1" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

These same commands are in the generated `builddockerfile.sh`.

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
   - **Security function** — state that the component uses a static canvas role (`canvasSystemRole`) with no security APIs exposed by default. If the user explicitly requested TMF672/TMF669 exposure, describe the conditional `permissionspec.enabled` flag.

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
- **roleInitializationMicroservice is opt-in, default No**: The default security model is a static canvas role (`canvasSystemRole`) with no dynamic role bootstrapping. Only generate the roleInitializationMicroservice source, its Dockerfile, and the corresponding Helm templates (`deployment-rolemanagement.yaml`, `service-rolemanagement.yaml`, `job-roleinitialization.yaml`) when the user explicitly confirms this in Step 2. This is a unified decision — confirming roleInitializationMicroservice enables all three artefacts; not confirming it omits all three.
- **`securityFunction.exposedAPIs` is always `[]` by default**: Even when roleInitializationMicroservice is generated, do not declare TMF672 or TMF669 in `securityFunction.exposedAPIs` unless the user explicitly requests security API exposure in the ODA Component CRD.
- **Spec resolution priority**: Always check `skills/create-oda-component/specs/` first for both the component YAML and any API spec files (`.yaml` or `.json`). Only download from the internet if the local specs folder is absent or contains no matching file. This applies to both the component specification (Step 1) and the API specs (Step 4a).
- **Naming consistency**: The Kubernetes service name for each API becomes the hostname for inter-service communication. It must match the `implementation` field in the Component CRD and the selector in the Service template.
