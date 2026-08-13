# Source Code Patterns

Reference patterns for generating new ODA Component source code. These patterns are derived from TMFC002 (ProductOrderCaptureAndValidation / TMF622 v4), which passes both the OpenAPI CTK and Component CTK. Reusable template files are bundled in this skill under `templates/source/`.

## Directory Structure

```
source/{ComponentName}/
├── builddockerfile.sh                          # Multi-platform Docker build script
├── {apiname}-dockerfile                        # Dockerfile for each API microservice
├── roleinitialization-dockerfile               # Dockerfile for role init job (only if roleInitMicroservice confirmed)
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
│       └── utils/                              # Copy all utils from templates/source/utils/
├── roleInitializationMicroservice/             # Only generated if user confirms in Step 2
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

**Only generate this dockerfile if the user confirmed roleInitializationMicroservice in Step 2.**

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

# Only include the following line if roleInitializationMicroservice was confirmed in Step 2:
# docker buildx build -t "{dockerhub-namespace}/roleinitialization:0.1" --platform "linux/amd64,linux/arm64" -f roleinitialization-dockerfile . --push

docker buildx build -t "{dockerhub-namespace}/{componentname}initialization:0.1" --platform "linux/amd64,linux/arm64" -f {component}initialization-dockerfile . --push

docker buildx build -t "{dockerhub-namespace}/openmetrics:1.0" --platform "linux/amd64,linux/arm64" -f openMetricsMicroservice-dockerfile . --push
```

Tell the user to replace `{dockerhub-namespace}` with their own Docker Hub username or container registry namespace.

---

## index.js Pattern (Express + Swagger entrypoint)

Every Node.js API microservice uses this standard pattern. The basePath handling strips leading/trailing slashes from both `componentName` and the spec's `basePath` before joining — this ensures a clean double-slash-free path regardless of what the downloaded swagger spec contains.

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
let componentName = process.env.COMPONENT_NAME || 'r1-{componentnamelower}';
componentName = componentName.replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes

const specBasePath = swaggerDoc.basePath.replace(/^\/+|\/+$/g, '');
swaggerDoc.basePath = '/' + componentName + '/' + specBasePath;

// Update swagger-ui to use the correct API docs URL
fs.readFile(path.join(__dirname, './node_modules/swagger-ui-dist/index.html'), 'utf8', function(err, data) {
  if (err) return console.log(err);
  let result = data.replace(/\/api-docs/g, swaggerDoc.basePath + '/api-docs');
  fs.writeFile(path.join(__dirname, './node_modules/swagger-ui-dist/index.html'), result, 'utf8', function(err) {
    if (err) return console.log(err);
  });
});

swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
  app.use(middleware.swaggerMetadata());
  app.use(middleware.swaggerValidator({ validateResponse: false }));
  app.use(errorHandler);
  app.use(middleware.swaggerRouter(options));
  app.use(middleware.swaggerUi({
    apiDocs: swaggerDoc.basePath + '/api-docs',
    swaggerUi: swaggerDoc.basePath + '/docs',
    swaggerUiDir: path.join(__dirname, 'node_modules', 'swagger-ui-dist')
  }));
  app.use(swaggerDoc.basePath, entrypointUtils.entrypoint);
  http.createServer(app).listen(serverPort, function() {
    console.log('Listening on port %d', serverPort);
  });
});

function errorHandler(err, req, res, next) {
  if (err && err.failedValidation) {
    const message = err.message || 'Request validation failed';
    return sendError(res, new TError(TErrorEnum.INVALID_BODY, message));
  } else {
    next(err);
  }
}
```

---

## package.json Pattern

`lodash` is required by `notificationUtils.js` for deep-diff state change detection. OpenTelemetry packages are optional — include them if the component needs distributed tracing.

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
    "core-js": "^3.6.5",
    "express": "^4.15.3",
    "js-yaml": "^3.3.0",
    "lodash": "^4.17.15",
    "mongodb": "^3.1.1",
    "query-to-mongo": "^0.9.0",
    "request": "^2.88.0",
    "request-promise": "^4.2.2",
    "swagger-tools": "^0.10.1",
    "swagger-ui-dist": "^3.17.6",
    "uuid": "^3.3.2"
  },
  "engines": { "node": ">=12.18.0", "npm": ">=6.0" },
  "devDependencies": { "nodemon": "^3.0.1" }
}
```

---

## Controller Pattern

Each resource in the API swagger spec gets a controller file. Controllers are thin passthroughs to the service layer. Only include operations that are defined in the swagger spec.

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

For list-only resources (no create/patch/delete), only include `list{Resource}` and `retrieve{Resource}`. For EventsSubscription (hub), only `registerListener` and `unregisterListener`.

---

## Service Pattern (business logic + MongoDB CRUD)

**All five CRUD operations must be implemented inline in each service file** — do not delegate list or retrieve to shared utility files. The inline implementations ensure the correct `X-Total-Count` / `X-Result-Count` response headers and pagination links are set, which are required for CTK compliance.

### Imports block (top of every service file)

```javascript
// service/{Resource}Service.js
'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const {sendDoc} = require('../utils/mongoUtils');
const {traverse, processCommonAttributes} = require('../utils/operationsUtils');
const {validateRequest} = require('../utils/ruleUtils');
const {processAssignmentRules} = require('../utils/operations');
const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');
const {updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');
```

### Pagination helpers (top of service file, before exports)

These helpers are used by the `list` operation. Copy them verbatim:

```javascript
const generateQueryString = function(query, offset, limit) {
  var queryStr = '';
  if (query.criteria !== undefined) {
    Object.keys(query.criteria).forEach(function(key) {
      queryStr += key + '=' + query.criteria[key] + '&';
    });
  }
  if (limit !== undefined) queryStr += 'limit=' + limit + '&';
  if (offset !== undefined) queryStr += 'offset=' + offset;
  return queryStr;
};

const generateLink = function(query, skip, limit, type, totalSize) {
  var offset;
  switch(type) {
    case 'first': offset = 0; break;
    case 'prev':  offset = Math.max(0, skip - limit); break;
    case 'next':  offset = skip + limit; break;
    case 'last':  offset = Math.max(0, totalSize - limit); break;
    default:      offset = skip;
  }
  return '<?' + generateQueryString(query, offset, limit) + '>; rel="' + type + '"';
};

const setLinks = function(res, query, skip, limit, totalSize) {
  var links = [];
  links.push(generateLink(query, skip, limit, 'self', totalSize));
  if (skip > 0) links.push(generateLink(query, skip, limit, 'first', totalSize));
  if (skip > 0) links.push(generateLink(query, skip, limit, 'prev', totalSize));
  if (limit && (skip + limit) < totalSize) links.push(generateLink(query, skip, limit, 'next', totalSize));
  if (limit && (skip + limit) < totalSize) links.push(generateLink(query, skip, limit, 'last', totalSize));
  res.setHeader('Link', links.join(', '));
};
```

### create (POST) — ensures mandatory attributes via processCommonAttributes

`processCommonAttributes` is the mechanism that sets mandatory response attributes (`id`, `href`, `lastUpdate`, `@type`, `@baseType`, `@schemaLocation`) by reading the swagger schema definition for the resource type. It must always be called in the create chain. Without it, the API will not return these required attributes and will fail the OpenAPI CTK.

```javascript
exports.create{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'create{Resource}', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('create{Resource}', payload))
    .then(payload => {
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload).then(() => {
          payload = cleanPayloadServiceType(payload);
          sendDoc(res, 201, payload);
          notificationUtils.publish(req, payload);
        }).catch(error => { console.log("create{Resource}: error=" + error); sendError(res, internalError); });
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
};
```

If this resource has **dependent API href validation** (see the Dependent API Href Validation section below), add those steps after `processAssignmentRules`:
```javascript
    .then(payload => processAssignmentRules('create{Resource}', payload))
    .then(payload => validate{Field}Href(payload))   // if this resource references a dependent API
    .then(payload => {
```

### list (GET collection) — CTK-critical headers

The `X-Total-Count` and `X-Result-Count` response headers are required by the Component CTK. They must be set from the collection stats and actual result count respectively. Return HTTP 206 (Partial Content) when a limit is applied and the result is smaller than the total collection size.

```javascript
exports.list{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  var query = mongoUtils.getMongoQuery(req);
  mongoUtils.connect().then(db => {
    db.collection(resourceType).stats().then(stats => {
      const totalSize = stats.count;
      db.collection(resourceType).find(query.criteria, query.options).toArray().then(doc => {
        doc = cleanPayloadServiceType(doc);
        res.setHeader('X-Total-Count', totalSize);
        res.setHeader('X-Result-Count', doc.length);
        var skip = query.options.skip !== undefined ? parseInt(query.options.skip) : 0;
        var limit;
        if (query.options.limit !== undefined) limit = parseInt(query.options.limit);
        if (limit || skip > 0) setLinks(res, query, skip, limit, totalSize);
        var code = 200;
        if (limit && doc.length < totalSize) code = 206;
        sendDoc(res, code, doc);
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};
```

### retrieve (GET by id)

```javascript
exports.retrieve{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  var query = mongoUtils.getMongoQuery(req);
  const id = req.swagger.params['id'].value;
  query.criteria.id = id;
  mongoUtils.connect().then(db => {
    db.collection(resourceType).findOne(query.criteria, query.options).then(doc => {
      if (doc == undefined) {
        sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
      } else {
        doc = cleanPayloadServiceType(doc);
        sendDoc(res, 200, doc);
      }
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};
```

### patch (PATCH by id)

**Do NOT call `processCommonAttributes` or `processAssignmentRules` in patch** — these are only for create. The patch chain reads the existing document first (to return RESOURCE_NOT_FOUND if it doesn't exist), applies the update, then reads the updated document to return it. The old document is passed to `notificationUtils.publish` as the second argument for state-change detection.

```javascript
exports.patch{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'patch{Resource}', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => {
      mongoUtils.connect().then(db => {
        const id = req.swagger.params['id'].value;
        const query = { id: id };
        db.collection(resourceType).findOne(query).then(old => {
          if (old == undefined) {
            return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
          }
          payload = swaggerUtils.updatePayloadServiceType(payload, req, 'id');
          db.collection(resourceType).updateOne(query, {$set: payload}).then(() => {
            db.collection(resourceType).findOne(query).then(doc => {
              doc = swaggerUtils.cleanPayloadServiceType(doc);
              sendDoc(res, 200, doc);
              notificationUtils.publish(req, doc, old);
            }).catch(error => sendError(res, internalError));
          }).catch(error => sendError(res, internalError));
        }).catch(error => sendError(res, internalError));
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
};
```

### delete (DELETE by id)

```javascript
exports.delete{Resource} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  mongoUtils.connect().then(db => {
    const id = req.swagger.params['id'].value;
    const query = { id: id };
    db.collection(resourceType).findOne(query).then(old => {
      if (old == undefined) {
        return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
      }
      db.collection(resourceType).deleteOne(query).then(() => {
        sendDoc(res, 204, {});
        notificationUtils.publish(req, old);
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};
```

### EventsSubscription (hub — register/unregister only)

The EventsSubscription controller always delegates directly to `notificationUtils`. Do not use the CRUD pattern for these operations:

```javascript
// service/EventsSubscriptionService.js
'use strict';
const notificationUtils = require('../utils/notificationUtils');

exports.registerListener = function(req, res, next) {
  notificationUtils.register(req, res, next);
};

exports.unregisterListener = function(req, res, next) {
  notificationUtils.unregister(req, res, next);
};
```

### NotificationListenersClientSide (received events — use create pattern)

Each listener operation stores the received event in MongoDB. Use the same create chain as regular resources but without href validation steps:

```javascript
exports.listenTo{EventType} = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'listenTo{EventType}', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('listenTo{EventType}', payload))
    .then(payload => {
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload).then(() => {
          payload = cleanPayloadServiceType(payload);
          sendDoc(res, 201, payload);
          notificationUtils.publish(req, payload);
        }).catch(error => sendError(res, internalError));
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
};
```

---

## Validation Rules (utils/rules.js)

The `rules.js` file contains per-resource-type validation rules used by `validateRequest` in the create and patch chains. Each resource type must have an entry in `validationRulesType2` with rules for each HTTP method it supports.

Rules are checked against the incoming payload before MongoDB operations. Without correct rules, required sub-object fields may be missing from payloads, causing CTK failures.

```javascript
// utils/rules.js
'use strict';

var validationRulesType2 = {};

// Add one entry per resource type exposed by this component.
// The key is the PascalCase resource type name (matches the swagger definition name).
validationRulesType2['{ResourceType}'] = {
  'POST': [
    // Each rule: {attribute: 'dotted.path', rule: 'required'|'notempty'|'format:date-time', message: 'description'}
    // Require the resource's mandatory top-level attributes:
    {attribute: '{mandatoryField}', rule: 'required', message: 'missing attribute'},
    // Require mandatory sub-object fields:
    {attribute: '{subObject}.{field}', rule: 'required', message: 'missing attribute'},
  ],
  'PATCH': [
    // For patch: usually just ensure the id isn't provided in the body (it comes from the URL)
    // Add rules for any fields that must be present if certain other fields are patched
  ]
};

// Legacy format (operation-name keyed) — used when validationRulesType2 doesn't match
var validationRules = {};

module.exports = {validationRules, validationRulesType2};
```

**How to determine what rules to add**: Look at the resource's swagger definition. Any field marked `required: true` in the schema definition is a candidate for a POST rule. Sub-objects (like `orderItem`, `relatedParty`) that the spec says are required should have both a rule for the array/object itself AND rules for the mandatory fields within it.

---

## Dependent API Href Validation (utils/ruleUtils.js)

When a component has a mandatory dependent API (`required: true` in the spec's `coreFunction.dependentAPIs`), the user may request that incoming payloads which reference resources in that API are validated before the record is saved. This prevents storing references to non-existent resources.

**Validation contract** (always apply):
- If the field is absent from the payload → skip validation and continue (no error raised)
- If the field is an array → iterate entries; skip entries where `href`/`id` is absent
- If a discriminator field (e.g. `@referredType`) limits which entries apply → only validate matching entries; skip others
- If the `href`/`id` is present but the GET returns non-200 or network error → reject with HTTP 422 (`TErrorEnum.UNPROCESSABLE_ENTITY`)

**Note**: `axios` must be added to `package.json` dependencies if not already present. `https` is a Node.js built-in. `TError`/`TErrorEnum` are already imported in the template `ruleUtils.js`.

### Step 1 — Add validator to `utils/ruleUtils.js`

Add `https` and `axios` requires at the top, then one async function per validated field.

#### Pattern A — Scalar field (single href on the payload, e.g. `productSpecification.href`)

```javascript
const https = require('https');
const axios = require('axios');

async function validate{FieldName}Href(payload) {
  const href = payload?.{path}?.{to}?.{field}?.href;
  if (!href) return payload;  // field absent → skip
  try {
    await axios.get(href, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 3000
    });
  } catch (err) {
    if (err?.code !== undefined && err?.reason !== undefined) throw err; // already a TError
    throw new TError(TErrorEnum.UNPROCESSABLE_ENTITY, `Could not resolve {fieldName}.href: ${href}`);
  }
  return payload;
}
```

#### Pattern B — Array field with conditional validation (e.g. `relatedParty[*].href` where `@referredType` discriminates)

Use this pattern when the field is an array of objects and only a subset of entries (identified by a discriminator property) should be validated against the dependent API.

```javascript
const https = require('https');
const axios = require('axios');

async function validate{FieldName}Href(payload) {
  const items = payload?.{arrayField};
  if (!items || !Array.isArray(items)) return payload;  // field absent → skip

  for (const item of items) {
    // Only validate entries that match the discriminator value
    if (item?.['@referredType'] !== '{discriminatorValue}') continue;
    const href = item?.href;
    if (!href) continue;  // href absent on this entry → skip
    try {
      await axios.get(href, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 3000
      });
    } catch (err) {
      if (err?.code !== undefined && err?.reason !== undefined) throw err;
      throw new TError(TErrorEnum.UNPROCESSABLE_ENTITY, `Could not resolve {fieldName}.href: ${href}`);
    }
  }
  return payload;
}
```

Export the new function:

```javascript
module.exports = { validateRequest, validate{FieldName}Href };
```

### Step 2 — Wire into the service (V4 vs V5 differ here)

**V4 (swagger 2.0 / `.then()` chain)** — add to the create chain in each resource's service file:

```javascript
const { validateRequest, validate{FieldName}Href } = require('../utils/ruleUtils');

// In the create chain, after processAssignmentRules:
    .then(payload => processAssignmentRules('create{Resource}', payload))
    .then(payload => validate{FieldName}Href(payload))
    .then(payload => {
      // insertOne...
```

**V5 (OpenAPI 3.x / `Service.serve()`)** — override `create{Resource}` in the thin service shell to pre-validate before delegating to `Service.serve()`. Use a corrected catch handler that preserves TError status codes:

```javascript
// services/{Resource}Service.js — override only the create function:
const Service = require('./Service');
const { validate{FieldName}Href } = require('../utils/ruleUtils');

const create{Resource} = (args, context) => new Promise(async (resolve) => {
  context.classname   = '{Resource}';
  context.operationId = 'create{Resource}';
  context.method      = 'post';
  try {
    if (args.body) await validate{FieldName}Href(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    // { code, error } = already wrapped by Service.rejectResponse — pass through as-is.
    // Raw TError (from href validation) = wrap via Service.rejectResponse to get correct HTTP status.
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});
```

The standard catch handler `Service.rejectResponse(e.message || 'Invalid input', e.status || 405)` must NOT be used here — it strips `TError.statusCode` (422) and returns 405 instead.

---

## Utils (copy from bundled templates)

Copy all utils from `templates/source/utils/` (bundled in this skill) into each new microservice's `utils/` folder. The key utils are:

| File | Purpose |
|------|---------|
| `mongoUtils.js` | MongoDB connection using `RELEASE_NAME` env var. `sendDoc` always deletes `_id`, sets `Location` header from `doc.href`, sets `Content-Type: application/json`. `getMongoQuery` handles filtering, field projection, and date-time regex matching. |
| `swaggerUtils.js` | Loads `api/swagger.yaml`, extracts resource types from 201/200 response schemas, manages `_serviceType` internal field |
| `notificationUtils.js` | Hub subscription management (`register`/`unregister`/`publish`). Requires `lodash` for deep diff state-change detection. |
| `errorUtils.js` | `TError`/`TErrorEnum` structured error handling. Key codes: 404=RESOURCE_NOT_FOUND, 400=INVALID_BODY, 422=UNPROCESSABLE_ENTITY, 500=INTERNAL_SERVER_ERROR |
| `entrypoint.js` | TMF630-compliant API entrypoint listing all operations as `_links` at the basePath root |
| `operationsUtils.js` | `processCommonAttributes` (sets mandatory response attrs), `traverse` (schema validation), `setBaseProperties`, `addHref` |
| `ruleUtils.js` | `validateRequest` against `validationRulesType2` rules. Add `validate{Field}Href` functions here for dependent API validation. |
| `operations.js` | `processAssignmentRules` — add resource-specific computed fields (e.g. `state: 'acknowledged'`, timestamps) |
| `rules.js` | `validationRulesType2` — per-resource POST/PATCH validation rules. **Must be updated per component** — add an entry for each resource type. |
| `writer.js` | Legacy swagger-codegen artifact. Not used by any active service or controller code — present for backwards compatibility only. |

**Note**: `listResource.js` and `retrieveResource.js` exist as utilities but CTK-passing components implement list and retrieve inline in each service file (see Service Pattern above). Use the inline patterns — they correctly set `X-Total-Count`, `X-Result-Count`, and pagination `Link` headers.

The `RELEASE_NAME` env var in `mongoUtils.js` constructs the MongoDB connection string as `mongodb://{RELEASE_NAME}-mongodb:27017/tmf`.

---

## Environment Variables (API Microservices)

| Variable | Description | Example Value |
|----------|-------------|--------------|
| `COMPONENT_NAME` | Full component instance path prefix | `r1-productcatalogmanagement` |
| `RELEASE_NAME` | Helm release name (used for MongoDB hostname) | `r1` |
| `NODE_ENV` | Production mode | `production` |

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
const metricName = componentName.replace(/-/g, '_');
const client = require('prom-client');
const counter = new client.Counter({
  name: metricName + '_api_counter',
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

---

## V5 API Patterns (OpenAPI 3.x — `openapi.yaml` + `express-openapi-validator`)

Use these patterns when the downloaded API spec is OpenAPI 3.x (starts with `openapi: "3.x.x"` and uses `components/schemas/` instead of `definitions/`).

**Version detection**: read the first line of the downloaded spec file.
- `swagger: "2.0"` → use V4 patterns (connect + swagger-tools)
- `openapi: "3.x.x"` → use V5 patterns (express + express-openapi-validator)

### V5 Directory Structure

```
{apiname}Microservice/implementation/
├── index.js               # Entry point — wires plugins, launches ExpressServer
├── expressServer.js       # Express + express-openapi-validator HTTP server
├── logger.js              # Winston logger
├── config.js              # Configuration (reads config.json + env vars)
├── config.json            # {"strict_schema": false, "QUERY_LIMIT": 250}
├── api/
│   └── openapi.yaml       # OpenAPI 3.x spec (downloaded from TMF, annotated)
├── controllers/
│   ├── Controller.js      # Base controller (copy from templates/source-v5/controllers/)
│   └── {Resource}Controller.js  # Per-resource (generated)
├── services/
│   ├── Service.js         # Base service engine (copy from templates/source-v5/services/)
│   ├── NotificationHandler.js  # Event notification stub (copy from templates/source-v5/services/)
│   └── {Resource}Service.js    # Per-resource thin shell (generated)
├── plugins/
│   ├── plugins.js         # Plugin registry (copy from templates/source-v5/plugins/)
│   └── mongo.js           # MongoDB plugin (copy from templates/source-v5/plugins/)
└── utils/                 # Copy all from templates/source-v5/utils/
```

### V5 Infrastructure Files (copy verbatim from templates/source-v5/)

Copy these files verbatim — they are identical across all v5 components:
- `index.js`, `expressServer.js`, `logger.js`, `config.js`
- `controllers/Controller.js`
- `services/Service.js`, `services/NotificationHandler.js`
- `plugins/plugins.js`, `plugins/mongo.js`
- `utils/swaggerUtils.js`, `utils/operationsUtils.js`, `utils/responseHeaders.js`
- `utils/conformanceUtils.js`, `utils/errorUtils.js`, `utils/entrypoint.js`
- `utils/jsonpath.js`, `utils/ruleUtils.js`, `utils/rules.js`, `utils/operations.js`

Update these per component:
- `utils/operations.js` — add `if (operation === 'create{Resource}')` blocks
- `utils/rules.js` — add `validationRulesType2['{ResourceType}']` entries (optional in v5)

### V5 package.json Pattern

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
    "axios": "^1.7.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "express-openapi-validator": "^4.13.2",
    "js-yaml": "^4.1.0",
    "jsonpath": "^1.1.1",
    "mongodb": "^3.7.4",
    "query-to-mongo": "^0.9.0",
    "swagger-ui-express": "^4.6.3",
    "uuid": "^3.4.0",
    "winston": "^3.3.2"
  },
  "engines": { "node": ">=14.0.0", "npm": ">=6.0" },
  "devDependencies": { "nodemon": "^3.0.1" }
}
```

### V5 Spec Annotation (openapi.yaml — add `x-eov-operation-handler`)

`express-openapi-validator` routes operations to controllers via `x-eov-operation-handler`. Add this to every operation in the spec (equivalent to v4's `x-swagger-router-controller`):

```yaml
# In each path operation:
/productCatalogManagement/v5/catalog:
  post:
    operationId: createCatalog
    x-eov-operation-handler: controllers/CatalogController    # <-- add this
    ...
  get:
    operationId: listCatalog
    x-eov-operation-handler: controllers/CatalogController    # <-- add this
```

The handler path is relative to the `operationHandlers` directory set in `ExpressServer.launch()` (`path.join(__dirname)`). Map each resource's operations to `controllers/{Resource}Controller`.

### V5 Controller Pattern

Per-resource controller: sets `classname` and `operationId` on the `context`, then delegates to `Controller.handleRequest`. Each exported function name must match the `operationId` in the spec exactly.

```javascript
// controllers/{Resource}Controller.js
'use strict';
const Controller = require('./Controller');
const service = require('../services/{Resource}Service');

const create{Resource} = async (request, response) => {
  await Controller.handleRequest(request, response, service.create{Resource});
};
const list{Resource} = async (request, response) => {
  await Controller.handleRequest(request, response, service.list{Resource});
};
const retrieve{Resource} = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieve{Resource});
};
const patch{Resource} = async (request, response) => {
  await Controller.handleRequest(request, response, service.patch{Resource});
};
const delete{Resource} = async (request, response) => {
  await Controller.handleRequest(request, response, service.delete{Resource});
};

module.exports = { create{Resource}, list{Resource}, retrieve{Resource}, patch{Resource}, delete{Resource} };
```

### V5 Service Pattern (thin shell)

Each service file sets `classname`, `operationId`, and `method` on the `context` object, then calls `Service.serve()`. All CRUD logic lives in the base `Service` class — nothing is implemented in the per-resource service.

```javascript
// services/{Resource}Service.js
'use strict';
const Service = require('./Service');

const create{Resource} = (args, context) => new Promise(async (resolve) => {
  context.classname   = '{Resource}';
  context.operationId = 'create{Resource}';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const list{Resource} = (args, context) => new Promise(async (resolve) => {
  context.classname   = '{Resource}';
  context.operationId = 'list{Resource}';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieve{Resource} = (args, context) => new Promise(async (resolve) => {
  context.classname   = '{Resource}';
  context.operationId = 'retrieve{Resource}';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patch{Resource} = (args, context) => new Promise(async (resolve) => {
  context.classname   = '{Resource}';
  context.operationId = 'patch{Resource}';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const delete{Resource} = (args, context) => new Promise(async (resolve) => {
  context.classname   = '{Resource}';
  context.operationId = 'delete{Resource}';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { create{Resource}, list{Resource}, retrieve{Resource}, patch{Resource}, delete{Resource} };
```

**`context.method` values**: `'post'` for create, `'get'` for list/retrieve, `'patch'` for patch, `'delete'` for delete. `Service.serve()` dispatches on these. For list vs retrieve, `serve()` also checks whether `context.operationId` starts with `'list'`.

### V5 Create Chain (what `Service.create` does internally)

The base `Service.create` runs this chain automatically — **no per-resource code needed**:

```
replaceWithJavascriptTypes → processCommonAttributes → processAssignmentRules
→ processMissingProperties → populateMandatoryAttributes → processExcludedInPost
→ db.create → cleanPayloadServiceType → successResponse(201)
```

`processCommonAttributes` (v5 signature: `processCommonAttributes(type, obj, req)`) sets:
- `id` — uuid or integer based on schema type
- `href` — absolute URL: `http://{host}{path}/{id}`
- `creationDate` — `new Date()` (if in schema)
- `lastUpdate` — `new Date()`
- `@schemaLocation` — `config.SCHEMA_URL + "#/components/schemas/{Type}"`
- `@type`, `@baseType` — set to resource type name

**`processAssignmentRules` (v5)**: same if-chain pattern as v4. Add `if (operation === 'create{Resource}')` blocks in `utils/operations.js` for component-specific computed fields (e.g. `state`, timestamps).

### V5 Key Differences From V4

| Concern | V4 | V5 |
|---|---|---|
| Spec file | `api/swagger.yaml` | `api/openapi.yaml` |
| Schema location | `swagger.definitions[Type]` | `components.schemas[Type]` |
| Router field | `x-swagger-router-controller` | `x-eov-operation-handler` |
| Service per resource | Full CRUD inline | Thin shell → `Service.serve()` |
| `processCommonAttributes` signature | `(req, type, obj)` | `(type, obj, req)` |
| List result count | `db.stats().count` | `db.countDocuments()` via `db.findMany()` returning `[docs, totalSize]` |
| Date values in DB | `.toISOString()` strings | `new Date()` native Date objects |
| Response headers | Inline in each service | `generateResponseHeaders(context, query, totalSize, docLength)` |
| MongoDB connection | `RELEASE_NAME` env var → `MONGODB_HOST` | `dbhost`/`dbport`/`dbname` env vars (see Helm deployment section) |
| `@schemaLocation` | `http://{host}/docs/#/` | `config.SCHEMA_URL + "#/components/schemas/{Type}"` |
| `js-yaml` API | `safeLoad`/`safeDump` (v3) | `load`/`dump` — v4 removed `safe*` variants; always use `^4.1.0` |
| `servers[0].url` | Spec has `basePath` which is used directly | Spec URL often lacks `tmf-api/` prefix; `expressServer.js` injects it at startup |

### V5 `express-openapi-validator` Settings (Critical)

Always set `validateRequests: false` and `validateResponses: false` in `ExpressServer.launch()`. **Do not change these to `true`**:

- `validateRequests: true` — EOV rejects POST bodies that omit `@type` (required by OpenAPI schema, but CTK clients don't always send it). Results in 400 on every POST.
- `validateResponses: true` — EOV fails complex `allOf` response schemas even for valid responses (common in TMF v5 specs). Results in 500 on every GET.
- `validateRequests: false` (side effect) — EOV's request validator no longer runs, so `$ref` objects in `schema.parameters` stay unresolved. The base `Controller.js` template handles this by merging `request.openapi.pathParams` directly after the parameter loop — this is intentional. Do not remove that block.

### V5 `config.json` Template

```json
{
  "strict_schema": false,
  "QUERY_LIMIT": 250
}
```

The `db_host`/`db_port` can be added here or provided via `dbhost`/`dbport` environment variables.

---

## Naming Conventions

Given a component like `TMFC006-ServiceCatalogManagement`:
- Folder name: `source/ServiceCatalogManagement/`
- Primary API microservice folder: `serviceCatalogMicroservice/` (camelCase, lowercase first letter)
- Dockerfile: `servicecat-dockerfile`
- Docker image tag: `{namespace}/servicecatalogapi:1.0`
- Role init dockerfile: `roleinitialization-dockerfile` (same for all components) — **only generated if user confirmed roleInitializationMicroservice**
- Role init Docker image tag: `{namespace}/roleinitialization:0.1` — **only in builddockerfile.sh if roleInitializationMicroservice confirmed**
- Metrics Docker image tag: `{namespace}/openmetrics:1.0` (same for all components, already published)
- `COMPONENT_NAME` default (for local testing): `r1-{componentnamelower}` e.g. `r1-servicecatalogmanagement`