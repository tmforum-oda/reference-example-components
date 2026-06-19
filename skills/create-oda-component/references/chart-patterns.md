# Helm Chart Patterns

Reference patterns for generating new ODA Component Helm charts. Reusable template files are bundled in this skill under `templates/charts/`.

## Directory Structure

```
charts/{ComponentName}/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── component-{componentname}.yaml       # ODA Component CRD (most important)
    ├── deployment-{apiname}api.yaml         # One per API microservice
    ├── deployment-mongodb.yaml              # Standard MongoDB deployment
    ├── deployment-metricsapi.yaml           # Prometheus metrics deployment
    ├── service-{apiname}api.yaml            # One per API microservice
    ├── service-mongodb.yaml                 # MongoDB ClusterIP service
    ├── service-registerallevents.yaml       # Metrics/events service (port 4000)
    ├── job-{component}initialization.yaml   # Component-specific init job
    ├── persistentVolumeClaim-mongodb.yaml   # 5Gi MongoDB storage
    # --- Optional: only when user explicitly requests security API exposure ---
    ├── deployment-rolemanagement.yaml       # Conditional PartyRole/PermissionSpec
    ├── service-rolemanagement.yaml          # Role management service
    └── job-roleinitialization.yaml          # Role init job (runs once)
```

---

## Chart.yaml Pattern

```yaml
apiVersion: v2
name: {componentnamelower}
description: A reference example {CODE}-{ComponentName} ODA Component
type: application
version: 1.0.0
appVersion: "1.0.0"
```

---

## values.yaml Pattern

```yaml
component:
  id: {TMFCXXX}
  name: {componentnamelower}                    # e.g. productcatalogmanagement
  functionalBlock: {FunctionalBlock}
  publicationDate: 2024-01-01T00:00:00.000Z
  version: "0.0.1"
  storageClassName: default
  apipolicy:
    apiKeyVerification:
      enabled: false
      location: "header"
    rateLimit:
      enabled: false
      identifier: "IP"
      limit: "6"
      interval: "pm"
    quota:
      identifier: ""
      limit: ""
    OASValidation:
      requestEnabled: false
      responseEnabled: false
      allowUnspecifiedHeaders: false
      allowUnspecifiedQueryParams: false
      allowUnspecifiedCookies: false
    CORS:
      enabled: false
      allowCredentials: false
      allowOrigins: "https://allowed-origin.com"
      handlePreflightRequests:
        enabled: false
        allowHeaders: "Accept, Content-Type"
        allowMethods: "GET, POST"
        maxAge: 36000
    template: ""

security:
  canvasSystemRole: canvasRole

mongodb:
  port: 27017
  database: tmf

image:
  pullPolicy: Always    # used by all deployment templates via {{.Values.image.pullPolicy}}

api:
  image: {dockerhub-namespace}/{componentname}api:1.0
  versionLabel: {componentname}api-1.0
  otlp:
    console:
      enabled: false
    protobuffCollector:
      enabled: true
      url: http://observability-opentelemetry-collector.monitoring.svc.cluster.local:4318/v1/traces

metrics:
  image: lesterthomas/openmetrics:1.0    # reuse existing image

partyrole:
  image: lesterthomas/partyroleapi:1.1   # reuse existing image
  versionLabel: partyroleapi-1.1

permissionspec:
  image: lesterthomas/permissionspecapi:0.20   # reuse existing image
  versionLabel: permissionspecapi-0.20
  enabled: true                          # default: use permissionspec over partyrole

# Add one section per additional optional API:
# promotionmgmt:
#   image: {namespace}/{componentname}promotionapi:1.0
#   versionLabel: {componentname}promotionapi-1.0

canvasinfo:
  host: ""
  basepath: ""
```

---

## ODA Component CRD Template Pattern

This is the core template. Populate from the fetched specification YAML, translating static values into Helm template expressions.

**v1.1.0 schema change**: `implementation`, `apiType`, `gatewayConfiguration`, `path`, `developerUI`, and `port` are now nested **inside** each `specification[]` item, not at the top level of the `exposedAPIs` entry. Only `name` and `id` remain at the top level of each exposed API entry.

**`developerUI` path**: use `/api-docs` suffix for V5 APIs, `/docs` for V4 APIs.

**`port`**: use `8080` for V4 APIs, use the port from the API's `servers[0].url` for V5 APIs (e.g. `8620` for TMF620 v5).

```yaml
# templates/component-{componentname}.yaml
apiVersion: oda.tmforum.org/v1
kind: Component
metadata:
  name: {{.Release.Name}}-{{.Values.component.name}}
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  componentMetadata:
    id: {{.Values.component.id}}
    name: {{.Values.component.name}}
    functionalBlock: {{.Values.component.functionalBlock}}
    publicationDate: {{.Values.component.publicationDate}}
    status: specified
    version: {{.Values.component.version}}
    description: "{Description from specification YAML}"
    maintainers:
    - name: Your Name
      email: your.email@example.com
    owners:
    - name: Your Name
      email: your.email@example.com

  coreFunction:
    exposedAPIs:
    # MANDATORY API (required: true in spec) - always included
    # implementation details are inside specification[], not at the top level
    - name: {apiname}
      id: {TMFXXX}
      specification:
      - url: "{spec url from specification YAML — the user-selected version}"
        implementation: {{.Release.Name}}-{apishortname}api
        apiType: openapi
        gatewayConfiguration:
          apiKeyVerification: {{.Values.component.apipolicy.apiKeyVerification | toYaml | nindent 12}}
          rateLimit: {{.Values.component.apipolicy.rateLimit | toYaml | nindent 12}}
          quota: {{.Values.component.apipolicy.quota | toYaml | nindent 12}}
          OASValidation: {{.Values.component.apipolicy.OASValidation | toYaml | nindent 12}}
          CORS: {{.Values.component.apipolicy.CORS | toYaml | nindent 12}}
          template: "{{.Values.component.apipolicy.template}}"
        path: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{apiPathSegment}/v{n}
        developerUI: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{apiPathSegment}/v{n}/docs
        port: 8080

    # OPTIONAL API (required: false in spec, user chose to include)
    {{- if .Values.{optionalapi}.enabled }}
    - name: {optionalapiname}
      id: {TMFXXX}
      specification:
      - url: "{spec url}"
        implementation: {{.Release.Name}}-{optionalapishortname}api
        apiType: openapi
        gatewayConfiguration:
          apiKeyVerification: {{.Values.component.apipolicy.apiKeyVerification | toYaml | nindent 12}}
          rateLimit: {{.Values.component.apipolicy.rateLimit | toYaml | nindent 12}}
          quota: {{.Values.component.apipolicy.quota | toYaml | nindent 12}}
          OASValidation: {{.Values.component.apipolicy.OASValidation | toYaml | nindent 12}}
          CORS: {{.Values.component.apipolicy.CORS | toYaml | nindent 12}}
          template: "{{.Values.component.apipolicy.template}}"
        path: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{optionalapipath}/v{n}
        developerUI: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{optionalapipath}/v{n}/docs
        port: 8080
    {{- end }}

    # MCP Server (optional, only when MCPServer.enabled)
    {{- if .Values.component.MCPServer.enabled }}
    - name: {componentname}mcp
      id: {componentname}mcp
      specification:
      - implementation: {{.Release.Name}}-{componentname}mcp
        apiType: mcp
        path: /{{.Release.Name}}-{{.Values.component.name}}/mcp
        port: 8080
    {{- end }}

    dependentAPIs:
    {{- if .Values.component.dependentAPIs.enabled }}
    - name: {dependentapiname}
      apiType: openapi
      specification:
      - url: "{dependent api spec url}"
    {{- else }}
      []
    {{- end }}

  eventNotification:
    # CRITICAL: the `name` field for each publishedEvents / subscribedEvents entry is used by the
    # component operator to construct the Kubernetes resource name:
    #   "{release}-{component}-{name}"
    # Kubernetes names must be RFC 1123 compliant (lowercase alphanumeric + hyphens, no spaces).
    # ALWAYS use lowercase-kebab-case for name — NEVER use display names with spaces or uppercase.
    # Example: use `party-management-api`, NOT `Party Management API`
    publishedEvents: []
    subscribedEvents: []

  managementFunction:
    exposedAPIs:
    - name: metrics
      apiType: prometheus
      gatewayConfiguration:
        apiKeyVerification: {{.Values.component.apipolicy.apiKeyVerification | toYaml | nindent 10}}
        rateLimit: {{.Values.component.apipolicy.rateLimit | toYaml | nindent 10}}
        quota: {{.Values.component.apipolicy.quota | toYaml | nindent 10}}
        OASValidation: {{.Values.component.apipolicy.OASValidation | toYaml | nindent 10}}
        CORS: {{.Values.component.apipolicy.CORS | toYaml | nindent 10}}
        template: "{{.Values.component.apipolicy.template}}"
      implementation: {{.Release.Name}}-{{.Values.component.name}}-sm
      path: /{{.Release.Name}}-{{.Values.component.name}}/metrics
      port: 4000

  securityFunction:
    canvasSystemRole: {{ .Values.security.canvasSystemRole }}
    exposedAPIs: []
```

**Default**: `exposedAPIs: []` — the permissionspecapi is always deployed for canvas role management but is not declared in the component spec. Only add an entry below if the user explicitly requests security API exposure.

**Optional — TMF672 (permissionspecapi), add only on explicit user request:**
```yaml
  securityFunction:
    canvasSystemRole: {{ .Values.security.canvasSystemRole }}
    exposedAPIs:
    {{- if .Values.permissionspec.enabled }}
    - name: userrolesandpermissions
      id: TMF672
      specification:
      - url: "https://raw.githubusercontent.com/tmforum-apis/TMF672_UserRolePermissions/master/TMF672-UserRolePermissions-v5.0.0.swagger.json"
        implementation: {{.Release.Name}}-permissionspecapi
        apiType: openapi
        gatewayConfiguration:
          apiKeyVerification: {{.Values.component.apipolicy.apiKeyVerification | toYaml | nindent 12}}
          rateLimit: {{.Values.component.apipolicy.rateLimit | toYaml | nindent 12}}
          quota: {{.Values.component.apipolicy.quota | toYaml | nindent 12}}
          OASValidation: {{.Values.component.apipolicy.OASValidation | toYaml | nindent 12}}
          CORS: {{.Values.component.apipolicy.CORS | toYaml | nindent 12}}
          template: "{{.Values.component.apipolicy.template}}"
        path: /{{.Release.Name}}-{{.Values.component.name}}/rolesAndPermissionsManagement/v5
        developerUI: /{{.Release.Name}}-{{.Values.component.name}}/rolesAndPermissionsManagement/v5/docs
        port: 8080
    {{- else }}
    - name: partyrole
      id: TMF669
      specification:
      - url: "https://raw.githubusercontent.com/tmforum-apis/TMF669_PartyRole/master/TMF669-PartyRole-v4.0.0.swagger.json"
        implementation: {{.Release.Name}}-partyroleapi
        apiType: openapi
        gatewayConfiguration:
          apiKeyVerification: {{.Values.component.apipolicy.apiKeyVerification | toYaml | nindent 12}}
          rateLimit: {{.Values.component.apipolicy.rateLimit | toYaml | nindent 12}}
          quota: {{.Values.component.apipolicy.quota | toYaml | nindent 12}}
          OASValidation: {{.Values.component.apipolicy.OASValidation | toYaml | nindent 12}}
          CORS: {{.Values.component.apipolicy.CORS | toYaml | nindent 12}}
          template: "{{.Values.component.apipolicy.template}}"
        path: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/partyRoleManagement/v4
        developerUI: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/partyRoleManagement/v4/docs
        port: 8080
    {{- end }}
```

---

## Deployment Template Pattern (API Microservice)

```yaml
# templates/deployment-{apiname}api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Release.Name}}-{apishortname}api
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  replicas: 1
  selector:
    matchLabels:
      impl: {{.Release.Name}}-{apishortname}api
  template:
    metadata:
      labels:
        app: {{.Release.Name}}-{{.Values.component.name}}
        impl: {{.Release.Name}}-{apishortname}api
        version: {{.Values.api.versionLabel}}
    spec:
      containers:
      - name: {{.Release.Name}}-{apishortname}api
        image: {{.Values.api.image}}
        imagePullPolicy: {{.Values.image.pullPolicy}}
        env:
        - name: RELEASE_NAME
          value: {{.Release.Name}}
        - name: COMPONENT_NAME
          value: {{.Release.Name}}-{{.Values.component.name}}
        - name: OTL_EXPORTER_CONSOLE_ENABLED
          value: "{{.Values.api.otlp.console.enabled}}"
        - name: OTL_EXPORTER_TRACE_PROTO_ENABLED
          value: "{{.Values.api.otlp.protobuffCollector.enabled}}"
        - name: OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL
          value: {{.Values.api.otlp.protobuffCollector.url}}
        - name: MONGODB_HOST
          value: {{.Release.Name}}-mongodb
        - name: MONGODB_PORT
          value: "{{.Values.mongodb.port}}"
        - name: MONGODB_DATABASE
          value: {{.Values.mongodb.database}}
        - name: NODE_ENV
          value: production
        - name: CANVAS_INFO_HOST_PORT
          value: "{{.Values.canvasinfo.host}}"
        - name: CANVAS_INFO_BASEPATH
          value: "{{.Values.canvasinfo.basepath}}"
        ports:
        - name: {{.Release.Name}}-{abbrapi}
          containerPort: 8080
        startupProbe:
          httpGet:
            path: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{apiPathSegment}/v{n}/{primaryResource}
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 30
```

For the `startupProbe` path, use the first/primary resource from the API spec (e.g. `catalog` for ProductCatalog, `product` for ProductInventory).

### V5 API Deployment Differences

V5 microservices use different env var names for MongoDB and expose a non-standard port. Replace the V4 env block with this when generating a V5 deployment:

```yaml
        env:
        - name: COMPONENT_NAME
          value: {{.Release.Name}}-{{.Values.component.name}}
        - name: PORT
          value: "{apiPort}"          # port from the API spec servers[0].url, e.g. 8620 for TMF620 v5
        - name: dbhost
          value: {{.Release.Name}}-mongodb
        - name: dbport
          value: "{{.Values.mongodb.port}}"
        - name: dbname
          value: {{.Values.mongodb.database}}
        - name: LOG_LEVEL
          value: "info"
        imagePullPolicy: {{.Values.image.pullPolicy}}
        ports:
        - containerPort: {apiPort}    # must match PORT env var above
        startupProbe:
          httpGet:
            path: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{apiPathSegment}/v{n}/{primaryResource}
            port: {apiPort}
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /{{.Release.Name}}-{{.Values.component.name}}/tmf-api/{apiPathSegment}/v{n}/{primaryResource}
            port: {apiPort}
          initialDelaySeconds: 10
          periodSeconds: 5
```

Key differences from V4:
- **No `RELEASE_NAME` env var** — V5 `mongo.js` uses `dbhost` directly, not `RELEASE_NAME-mongodb`
- **No `MONGODB_HOST`/`MONGODB_PORT`/`MONGODB_DATABASE`** — replaced by `dbhost`/`dbport`/`dbname`
- **`dbhost` = `{{.Release.Name}}-mongodb`** — just release name + `-mongodb`, NOT including component name (e.g. `pc-1-mongodb`, not `pc-1-productcatalogmanagement-mongodb`)
- **`PORT` env var + container port** — read from the API spec's `servers[0].url` (e.g. TMF620 v5 uses port `8620`); must match `containerPort` and all probe `port` fields
- **No `NODE_ENV`** — V5 uses Winston logger with `LOG_LEVEL` instead

---

## MongoDB Deployment (standard - reuse as-is)

```yaml
# templates/deployment-mongodb.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Release.Name}}-mongodb
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  replicas: 1
  selector:
    matchLabels:
      impl: {{.Release.Name}}-mongodb
  template:
    metadata:
      labels:
        impl: {{.Release.Name}}-mongodb
        app: {{.Release.Name}}-{{.Values.component.name}}
        version: mongo-latest
    spec:
      containers:
      - name: {{.Release.Name}}-mongodb
        image: mongo:5.0.1
        ports:
        - name: {{.Release.Name}}-mongodb
          containerPort: {{.Values.mongodb.port}}
        volumeMounts:
        - name: {{.Release.Name}}-mongodb-pv-storage
          mountPath: "/data/db"
      volumes:
      - name: {{.Release.Name}}-mongodb-pv-storage
        persistentVolumeClaim:
          claimName: {{.Release.Name}}-mongodb-pv-claim
```

---

## Service Template Pattern

```yaml
# templates/service-{apiname}api.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{.Release.Name}}-{apishortname}api
  labels:
    app: {{.Release.Name}}-{{.Values.component.name}}
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  ports:
  - port: 8080
    targetPort: {{.Release.Name}}-{abbrapi}
    name: http-{{.Release.Name}}-{apishortname}api
  type: NodePort
  selector:
    impl: {{.Release.Name}}-{apishortname}api
```

```yaml
# templates/service-mongodb.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{.Release.Name}}-mongodb
  labels:
    app: {{.Release.Name}}-{{.Values.component.name}}
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  ports:
  - port: {{.Values.mongodb.port}}
    targetPort: {{.Release.Name}}-mongodb
    name: tcp-{{.Release.Name}}-mongodb
  type: NodePort
  selector:
    impl: {{.Release.Name}}-mongodb
```

```yaml
# templates/service-registerallevents.yaml  (metrics service)
apiVersion: v1
kind: Service
metadata:
  name: {{.Release.Name}}-{{.Values.component.name}}-sm
  labels:
    app: {{.Release.Name}}-{{.Values.component.name}}
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  ports:
  - port: 4000
    targetPort: {{.Release.Name}}-prapi
    name: http-{{.Release.Name}}-metricsapi
  type: NodePort
  selector:
    impl: {{.Release.Name}}-metricsapi
```

---

## Job Templates

```yaml
# templates/job-roleinitialization.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{.Release.Name}}-roleinitialization
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  template:
    metadata:
      labels:
        app: {{.Release.Name}}-roleinitialization
    spec:
      containers:
      - name: {{.Release.Name}}-roleinitialization
        image: lesterthomas/roleinitialization:0.6
        env:
        - name: RELEASE_NAME
          value: {{.Release.Name}}
        - name: COMPONENT_NAME
          value: {{.Release.Name}}-{{.Values.component.name}}
        - name: USE_PERMISSION_SPEC
          value: "{{.Values.permissionspec.enabled}}"
        imagePullPolicy: Always
      restartPolicy: OnFailure
  backoffLimit: 10
```

```yaml
# templates/job-{componentname}initialization.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{.Release.Name}}-{componentname}initialization
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  template:
    metadata:
      labels:
        app: {{.Release.Name}}-{componentname}initialization
    spec:
      containers:
      - name: {{.Release.Name}}-{componentname}initialization
        image: {dockerhub-namespace}/{componentname}initialization:0.1
        env:
        - name: RELEASE_NAME
          value: {{.Release.Name}}
        - name: COMPONENT_NAME
          value: {{.Release.Name}}-{{.Values.component.name}}
        imagePullPolicy: Always
      restartPolicy: OnFailure
  backoffLimit: 10
```

---

## PersistentVolumeClaim (standard - reuse as-is)

```yaml
# templates/persistentVolumeClaim-mongodb.yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: {{.Release.Name}}-mongodb-pv-claim
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

---

## Role Management Deployment (optional — only when user explicitly requests security API exposure)

Only generate `deployment-rolemanagement.yaml`, `service-rolemanagement.yaml`, and `job-roleinitialization.yaml` when the user explicitly asks to expose TMF672 or TMF669 in the component's `securityFunction`. Also add `permissionspec` and `partyrole` sections to `values.yaml`.

The deployment is conditional on `permissionspec.enabled`:
- If `permissionspec.enabled=true`: deploy `permissionspecapi` image (TMF672)
- If `permissionspec.enabled=false`: deploy `partyroleapi` image (TMF669)

Reference `templates/charts/templates/deployment-rolemanagement.yaml` (bundled in this skill) for the exact template.

---

## Metrics Deployment (standard)

```yaml
# templates/deployment-metricsapi.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Release.Name}}-metricsapi
  labels:
    oda.tmforum.org/componentName: {{.Release.Name}}-{{.Values.component.name}}
spec:
  replicas: 1
  selector:
    matchLabels:
      impl: {{.Release.Name}}-metricsapi
  template:
    metadata:
      labels:
        app: {{.Release.Name}}-{{.Values.component.name}}
        impl: {{.Release.Name}}-metricsapi
    spec:
      containers:
      - name: {{.Release.Name}}-openmetrics
        image: {{.Values.metrics.image}}
        imagePullPolicy: {{.Values.image.pullPolicy}}
        env:
        - name: RELEASE_NAME
          value: {{.Release.Name}}
        - name: COMPONENT_NAME
          value: {{.Release.Name}}-{{.Values.component.name}}
        ports:
        - name: {{.Release.Name}}-prapi
          containerPort: 4000
```

**Note**: Use `{{.Values.image.pullPolicy}}` (not hardcoded `Always`) so it is configurable. Add `image.pullPolicy: Always` to `values.yaml` as the default.

---

## Naming in Helm Templates

Key naming conventions for Helm resources:

| Template placeholder | Meaning | Example |
|---------------------|---------|---------|
| `{componentname}` | lowercase component name | `servicecatalogmanagement` |
| `{ComponentName}` | PascalCase | `ServiceCatalogManagement` |
| `{apishortname}` | lowercase short API name | `svccat`, `prodcat`, `productinv` |
| `{abbrapi}` | port name (short, ≤15 chars) | `scapi`, `pcat`, `pivot` |
| `{apiPathSegment}` | path segment matching swagger basePath | `serviceCatalogManagement` |
| `{primaryResource}` | first resource name from API spec | `serviceSpecification`, `catalog` |

Use the `oda.tmforum.org/componentName` label on every Kubernetes resource — the ODA Canvas uses this label to identify resources belonging to the component.
