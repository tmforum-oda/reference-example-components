'use strict';

// TMF620 Product Catalog Management v5.0.0 API for the Product Catalog reference
// ODA Component (issue #87). It shares the component's MongoDB with the v4 API;
// documents are stored in the v5 format (see specs/87-productcatalog-tmf620-v4-v5).

if (process.env.OTL_EXPORTER_TRACE_PROTO_ENABLED !== 'false' || process.env.OTL_EXPORTER_CONSOLE_ENABLED === 'true') {
  require('./utils/instrumentationUtil');
}

const http = require('http');
const { createApp } = require('./app');
const { basePathFor } = require('./utils/spec');
const { mongoStore } = require('./utils/store');

const port = process.env.PORT || 8080;
const componentName = process.env.COMPONENT_NAME || 'r1-productcatalogmanagement'; // default for local testing
const validateResponses = process.env.OAS_VALIDATE_RESPONSES !== 'false';

const started = Date.now();
const store = mongoStore();
const app = createApp({ componentName, validateResponses, store });
const basePath = basePathFor(componentName);

http.createServer(app).listen(port, () => {
  console.log(`TMF620 v5 API for ${componentName} listening on port ${port} (ready in ${Date.now() - started} ms)`);
  console.log(`  API:        http://localhost:${port}${basePath}`);
  console.log(`  Swagger UI: http://localhost:${port}${basePath}/docs`);
  console.log(`  Database:   ${store.describe()} (shared with the v4 API)`);
  console.log(`  Response validation: ${validateResponses ? 'on' : 'off'}`);
});
