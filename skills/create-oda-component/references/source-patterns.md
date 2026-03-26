# Source Code Patterns

Reference patterns for generating new ODA Component source code. Reusable template files are bundled in this skill under `templates/source/`.

## Directory Structure

```
source/{ComponentName}/
├── builddockerfile.sh                          # Multi-platform Docker build script
├── {apiname}-dockerfile                        # Dockerfile for each API microservice
├── roleinitialization-dockerfile               # Dockerfile for role init job
├── {component}initialization-dockerfile        # Dockerfile for component init job
├── openMetricsMicroservice-dockerfile          # Dockerfile for metrics service
├── {apiname}Microservice/
│   └── implementation/
│       ├── index.js                            # Express server entrypoint
│       ├── package.json                        # Node dependencies
│       ├── config.json                         # {"strict_schema": true}
│       ├── index.html_replacement              # Swagger UI customization
│       ├── api/
│       │   └── swagger.yaml                    # OpenAPI spec (downloaded from TMF)
│       ├── controllers/
│       │   └── {Resource}.js                   # Thin controller passthrough
│       ├── service/
│       │   └── {Resource}Service.js            # Business logic with MongoDB CRUD
│       └── utils/                              # Copy all 14 utils from ProductCatalog
├── roleInitializationMicroservice/
│   └── implementation/
│       ├── initialization.js                   
│       └── package.json                        
└── openMetricsMicroservice/
    ├── index.js
    └── package.json
```

---

## Dockerfile Pattern (Node.js API)

```dockerfile
FROM node:16
COPY {apiname}Microservice/implementation/package*.json /src/
WORKDIR /src
RUN npm install
COPY {apiname}Microservice/implementation ./
EXPOSE 8080
CMD ["node", "index.js"]
```

## Dockerfile Pattern (Role Initialization Job)

```dockerfile
FROM node:10.19
COPY roleInitializationMicroservice/implementation/package*.json /src/
WORKDIR /src
RUN npm install
COPY roleInitializationMicroservice/implementation ./
CMD ["node", "initialization.js"]
```

## Dockerfile Pattern (Metrics Service)

```dockerfile
FROM node:10.19
COPY openMetricsMicroservice/package*.json /src/
WORKDIR /src
RUN npm install
COPY openMetricsMicroservice ./
EXPOSE 4000
CMD ["node", "index.js"]
```

---

## Build Script Pattern (builddockerfile.sh)

```bash
docker buildx build -t "{dockerhub-namespace}/{componentname}api:1.0" --platform "linux/amd64,linux/arm64" -f {apiname}-dockerfile . --push

docker buildx build -t "{dockerhub-namespace}/roleinitialization:0.1" --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "{dockerhub-namespace}/{componentname}initialization:0.1" --platform "linux/amd64,linux/arm64" -f {component}initialization-dockerfile . --push

docker buildx build -t "{dockerhub-namespace}/openmetrics:1.0" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

Tell the user to replace `{dockerhub-namespace}` with their own Docker Hub username or container registry namespace.

---

## index.js Pattern (Express + Swagger entrypoint)

Every Node.js API microservice uses this standard pattern:

```javascript
'use strict';
require("dotenv").config();
require('./utils/instrumentationUtil').init();

const fs = require('fs'), path = require('path'), http = require('http');
const mongoUtils = require('./utils/mongoUtils');
const swaggerUtils = require('./utils/swaggerUtils');
const entrypointUtils = require('./utils/entrypoint');
const {TError, TErrorEnum, sendError} = require('./utils/errorUtils');

const app = require('connect')();
const swaggerTools = require('swagger-tools');
const serverPort = process.env.PORT || 8080;

// Copy index.html_replacement to swagger-ui-dist
try {
  fs.copyFileSync(path.join(__dirname, './index.html_replacement'),
    path.join(__dirname, './node_modules/swagger-ui-dist/index.html'))
} catch (err) { console.log('Unable to replace swagger-ui-dist/index.html'); process.exit(1); }

const options = {
  swaggerUi: path.join(__dirname, '/swagger.json'),
  controllers: path.join(__dirname, './controllers'),
  useStubs: process.env.NODE_ENV === 'development'
};

const swaggerDoc = swaggerUtils.getSwaggerDoc();

// Get component instance name and prepend to API base path
let componentName = process.env.COMPONENT_NAME;
if (!componentName) {
  componentName = 'r1-{componentnamelower}'; // local testing default
}

// Update swagger-ui to use correct URL
fs.readFile(path.join(__dirname, './node_modules/swagger-ui-dist/index.html'), 'utf8', function(err, data) {
  if (err) return console.log(err);
  let result = data.replace(/url: \"/g, 'url: \"/' + componentName);
  fs.writeFile(path.join(__dirname, './node_modules/swagger-ui-dist/index.html'), result, 'utf8', function(err) {
    if (err) return console.log(err);
  });
});

swaggerDoc.basePath = '/' + componentName + swaggerDoc.basePath;

swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
  app.use(middleware.swaggerMetadata());
  app.use(middleware.swaggerValidator({ validateResponse: false }));
  app.use(errorHandler);
  app.use(middleware.swaggerRouter(options));
  app.use(middleware.swaggerUi({
    apiDocs: swaggerDoc.basePath + 'api-docs',
    swaggerUi: swaggerDoc.basePath + 'docs',
    swaggerUiDir: path.join(__dirname, 'node_modules', 'swagger-ui-dist')
  }));
  app.use(swaggerDoc.basePath, entrypointUtils.entrypoint);
  http.createServer(app).listen(serverPort, function() {
    console.log('Listening on port %d', serverPort);
  });
});

function errorHandler(err, req, res, next) {
  if (err && err.failedValidation) {
    // ... standard TMForum error handling from errorUtils
  } else { next(err); }
}
```

---

## package.json Pattern

```json
{
  "name": "{component-api-name}",
  "version": "1.0.0",
  "description": "TMF API Reference: {TMFXXX} - {API Name}",
  "main": "index.js",
  "scripts": {
    "prestart": "npm install",
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "license": "Apache-2.0",
  "private": true,
  "dependencies": {
    "@opentelemetry/api": "^1.7.0",
    "@opentelemetry/auto-instrumentations-node": "^0.40.0",
    "@opentelemetry/exporter-trace-otlp-proto": "^0.45.1",
    "@opentelemetry/sdk-metrics": "^1.18.1",
    "@opentelemetry/sdk-node": "^0.45.1",
    "@opentelemetry/sdk-trace-node": "^1.18.1",
    "axios": "^1.7.3",
    "body-parser": "^1.15.2",
    "cfenv": "^1.0.3",
    "commander": "^2.6.0",
    "connect": "^3.2.0",
    "dotenv": "^16.3.1",
    "express": "^4.15.3",
    "js-yaml": "^3.3.0",
    "mongodb": "^3.1.1",
    "query-to-mongo": "^0.9.0",
    "request": "^2.88.0",
    "request-promise": "^4.2.2",
    "swagger-tools": "0.10.1",
    "swagger-ui-dist": "^3.17.6",
    "uuid": "^3.3.2"
  },
  "engines": { "node": ">=8.10", "npm": ">=6.0" },
  "devDependencies": { "nodemon": "^3.0.1" }
}
```

---

## Controller Pattern

Each resource in the API swagger spec gets a controller file. Controllers are thin passthroughs to the service layer:

```javascript
// controllers/{Resource}.js
'use strict';
var url = require('url');
var {Resource} = require('../service/{Resource}Service');

module.exports.create{Resource} = function(req, res, next) {
  {Resource}.create{Resource}(req, res, next);
};
module.exports.delete{Resource} = function(req, res, next) {
  {Resource}.delete{Resource}(req, res, next);
};
module.exports.list{Resource} = function(req, res, next) {
  {Resource}.list{Resource}(req, res, next);
};
module.exports.patch{Resource} = function(req, res, next) {
  {Resource}.patch{Resource}(req, res, next);
};
module.exports.retrieve{Resource} = function(req, res, next) {
  {Resource}.retrieve{Resource}(req, res, next);
};
```

Only include CRUD operations that are defined in the swagger spec. For list-only resources, only include `list{Resource}` and `retrieve{Resource}`.

---

## Service Pattern (business logic + MongoDB CRUD)

```javascript
// service/{Resource}Service.js
'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const listResource = require('../utils/listResource').listResource;
const retrieveResource = require('../utils/retrieveResource').retrieveResource;
const {sendDoc} = require('../utils/mongoUtils');
const {setBaseProperties, traverse, addHref, processCommonAttributes} = require('../utils/operationsUtils');
const {validateRequest} = require('../utils/ruleUtils');
const {processAssignmentRules} = require('../utils/operations');
const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');
const {updateQueryServiceType, updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

exports.create{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'create{Resource}', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('create{Resource}', payload))
    .then(payload => {
      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload)
          .then(() => {
            payload = cleanPayloadServiceType(payload);
            sendDoc(res, 201, payload);
            notificationUtils.publish(req, payload);
          })
          .catch(error => { console.log("create{Resource}: error=" + error); sendError(res, internalError); })
      }).catch(error => { sendError(res, internalError); });
    }).catch(error => sendError(res, error));
};

exports.list{Resource} = function(req, res, next) {
  listResource(req, res, next);
};

exports.retrieve{Resource} = function(req, res, next) {
  retrieveResource(req, res, next);
};

exports.patch{Resource} = function(req, res, next) {
  // Similar pattern: getPayload → validate → traverse → patch in MongoDB → notify
};

exports.delete{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  mongoUtils.connect().then(db => {
    const id = swaggerUtils.getResourceId(req);
    db.collection(resourceType).deleteOne({id: id})
      .then(result => {
        if (result.deletedCount === 0) sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
        else sendDoc(res, 204, {});
      })
      .catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};
```

---

## Utils (copy from bundled templates)

Copy all utils from `templates/source/utils/` (bundled in this skill) into each new microservice's `utils/` folder. The key utils are:

| File | Purpose |
|------|---------|
| `mongoUtils.js` | MongoDB connection using `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE` env vars |
| `swaggerUtils.js` | Load swagger spec, extract types, manage payload schemas |
| `notificationUtils.js` | Publish events to hub subscriptions |
| `instrumentationUtil.js` | OpenTelemetry setup for tracing |
| `errorUtils.js` | `TError`/`TErrorEnum` structured error handling |
| `entrypoint.js` | TMF630-compliant API entrypoint listing all operations |
| `operationsUtils.js` | `setBaseProperties`, `traverse`, `addHref`, `processCommonAttributes` |
| `ruleUtils.js` | `validateRequest` against swagger schemas |
| `operations.js` → `rules.js` | `processAssignmentRules` business logic hooks |
| `listResource.js` | Standard list/filter/paginate operation |
| `retrieveResource.js` | Standard single resource retrieval |
| `downstreamAPI.js` | Call downstream dependent APIs |
| `writer.js` | Response writing helpers |

The `MONGODB_HOST` is set to `{ReleaseName}-mongodb` in Kubernetes (the MongoDB service name).

---

## Environment Variables (API Microservices)

| Variable | Description | Example Value |
|----------|-------------|--------------|
| `COMPONENT_NAME` | Full component instance path prefix | `r1-productcatalogmanagement` |
| `RELEASE_NAME` | Helm release name | `r1` |
| `MONGODB_HOST` | MongoDB service name | `r1-mongodb` |
| `MONGODB_PORT` | MongoDB port | `27017` |
| `MONGODB_DATABASE` | Database name | `tmf` |
| `NODE_ENV` | Production mode | `production` |
| `OTL_EXPORTER_CONSOLE_ENABLED` | Enable console tracing | `false` |
| `OTL_EXPORTER_TRACE_PROTO_ENABLED` | Enable OTLP tracing | `true` |
| `OTL_EXPORTER_TRACE_PROTO_COLLECTOR_URL` | OTLP collector URL | `http://...` |

---

## Role Initialization Microservice

Creates an initial `canvasRole` during deployment. Retries every 5 seconds until successful. Supports both TMF669 PartyRole and TMF672 PermissionSpecificationSet via `USE_PERMISSION_SPEC` env var.

```javascript
// roleInitializationMicroservice/implementation/initialization.js
const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));
var releaseName = process.env.RELEASE_NAME;
var componentName = process.env.COMPONENT_NAME;
const usePermissionSpec = process.env.USE_PERMISSION_SPEC === 'true';

const createRole = async () => {
  var complete = false;
  while (!complete) {
    try {
      await delay(5000);
      let url, payload;
      if (usePermissionSpec) {
        url = `http://${releaseName}-permissionspecapi:8080/${componentName}/rolesAndPermissionsManagement/v5/permissionSpecificationSet`;
        payload = { "@type": "PermissionSpecificationSet", name: "canvasRole", ... };
      } else {
        url = `http://${releaseName}-partyroleapi:8080/${componentName}/tmf-api/partyRoleManagement/v4/partyRole`;
        payload = { name: "canvasRole" };
      }
      const res = await axios.post(url, payload, {timeout: 10000});
      complete = true;
      // Signal Istio sidecar completion
      await axios.post('http://localhost:15020/quitquitquit');
    } catch(err) {
      console.log("Error creating role, retrying...", err.message);
    }
  }
};
createRole();
```

```json
// roleInitializationMicroservice/implementation/package.json
{ "name": "roleinitialization", "version": "0.1.0", "dependencies": { "axios": "^0.21.1" } }
```

---

## Metrics Microservice (openMetrics)

Simple Express server that listens for event notifications and tracks them as Prometheus counters.

```javascript
// openMetricsMicroservice/index.js
const express = require('express');
const server = express();
server.use(express.json());
var componentName = process.env.COMPONENT_NAME || '{componentnamelower}';
const client = require('prom-client');
const counter = new client.Counter({
  name: '{componentnamelower}_api_counter',
  help: 'Count of Notification Events from {TMFXXX} {API Name}',
  labelNames: ['NotificationEvent']
});

server.post('/listener', function(req, res) {
  const notificationEvent = req.body['@type'] || req.body.eventType || 'unknown';
  counter.inc({NotificationEvent: notificationEvent});
  res.status(204).send();
});

server.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

server.listen(4000, () => console.log('Metrics server listening on port 4000'));
```

```json
// openMetricsMicroservice/package.json
{ "name": "openmetrics", "version": "1.0.0", "dependencies": { "express": "^4.17.1", "prom-client": "^14.0.0" } }
```

---

## MCP Server Microservice (Python - Optional)

When the user wants AI agent access to the component's APIs, add an MCP Server following the pattern in `source/ProductCatalog/MCPServerMicroservice/`.

Structure:
```
{componentname}MCPServerMicroservice/
├── {componentname}_mcp_server.py   # FastMCP server with tool definitions
├── {componentname}_api.py          # Async httpx API client
└── pyproject.toml                  # Python dependencies
```

The MCP server uses FastMCP (Anthropic SDK) with Streamable HTTP transport on port 8080 at `/mcp`. It reads `RELEASE_NAME` and `COMPONENT_NAME` env vars to construct API URLs. Add a dockerfile using `python:3.13` base image.

```dockerfile
# {componentname}-mcp-dockerfile
FROM python:3.13
COPY {componentname}MCPServerMicroservice /src/
WORKDIR /src
RUN pip install .
EXPOSE 8080
CMD ["python", "{componentname}_mcp_server.py"]
```

---

## Naming Conventions

Given a component like `TMFC006-ServiceCatalogManagement`:
- Folder name: `source/ServiceCatalogManagement/`
- Primary API microservice folder: `serviceCatalogMicroservice/` (camelCase, lowercase first letter)
- Dockerfile: `servicecat-dockerfile`
- Docker image tag: `{namespace}/servicecatalogapi:1.0`
- Role init dockerfile: `roleinitialization-dockerfile` (same for all components)
- Role init Docker image tag: `{namespace}/roleinitialization:0.1`
- Metrics Docker image tag: `{namespace}/openmetrics:1.0` (same for all components, already published)
- `COMPONENT_NAME` default (for local testing): `r1-{componentnamelower}` e.g. `r1-servicecatalogmanagement`
