'use strict';

// Express app for the TMF620 v5.0.0 API. Kept separate from index.js (which adds
// tracing and listens) so tests can build an app without a network port or MongoDB.

const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');
const swaggerUiDist = require('swagger-ui-dist');

const { specForComponent, basePathFor, listOperations, toExpressPath, validatorSpec } = require('./utils/spec');
const { sendError, fromValidationError } = require('./utils/tmfError');
const { handlerLookup } = require('./handlers');
const { createHandlers } = require('./handlers/resources');

const JSON_TYPES = [
  'application/json',
  'application/merge-patch+json',
  'application/json-patch+json',
  'application/json-patch-query+json'
];

function createApp(options) {
  const componentName = options.componentName;
  const validateResponses = options.validateResponses !== false;
  const spec = specForComponent(componentName);
  const basePath = basePathFor(componentName);
  // options.store: utils/store.js (MongoDB shared with the v4 API, or in memory for tests)
  const handlerFor = handlerLookup(options.store ? createHandlers({ store: options.store, componentName }) : undefined);
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ type: JSON_TYPES, limit: '1mb' }));

  // Entry point: links to every operation, like the v4 API's entry point
  app.get([basePath, basePath + '/'], (req, res) => {
    const links = { self: { href: basePath, title: spec.info.title, version: spec.info.version } };
    for (const op of listOperations(spec)) {
      links[op.operationId] = { href: basePath + op.path, method: op.method.toUpperCase() };
    }
    res.json({ _links: links });
  });

  // OAS document and Swagger UI (developerUI in the component spec)
  app.get(basePath + '/api-docs', (req, res) => res.json(spec));
  app.get(basePath + '/docs', (req, res, next) => {
    // Express matches /docs and /docs/ alike; only redirect the form without the slash
    if (req.originalUrl.split('?')[0].endsWith('/')) return next();
    res.redirect(basePath + '/docs/');
  });
  app.get(basePath + '/docs/swagger-initializer.js', (req, res) => {
    res.type('application/javascript').send(
      `window.onload = function () { window.ui = SwaggerUIBundle({ url: ${JSON.stringify(basePath + '/api-docs')}, dom_id: '#swagger-ui', deepLinking: true, presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset], layout: 'StandaloneLayout' }); };`
    );
  });
  app.use(basePath + '/docs', express.static(swaggerUiDist.getAbsoluteFSPath(), { index: 'index.html' }));

  app.use(OpenApiValidator.middleware({
    apiSpec: validatorSpec(spec),
    validateRequests: {
      // TMF list operations accept attribute filters (?name=...&lifecycleStatus=...)
      // that the OAS does not list as parameters
      allowUnknownQueryParameters: true,
      // Report every problem in one response, not just the first
      allErrors: true
    },
    validateResponses,
    validateSecurity: false,
    // Attachment.content declares format: base64, which Ajv does not know
    formats: { base64: /^[A-Za-z0-9+/]*={0,2}$/ },
    // The entry point and the docs are not TMF operations
    ignorePaths: (p) => p === basePath || p === basePath + '/' || p.startsWith(basePath + '/docs') || p === basePath + '/api-docs'
  }));

  const router = express.Router({ mergeParams: true });
  for (const op of listOperations(spec)) {
    const handler = handlerFor(op.operationId);
    router[op.method](toExpressPath(op.path), (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next));
  }
  app.use(basePath, router);

  app.use(basePath, (req, res) => sendError(res, 404, 'TMF620-V5-404', 'Resource or operation not found', `${req.method} ${req.originalUrl}`));

  // Validation and other errors as TMF Error bodies
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return sendError(res, 400, 'TMF620-V5-400', 'Request body is not valid JSON', err.message);
    }
    const { status, body } = fromValidationError(err);
    if (status >= 500) console.error(`${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
    res.status(status).json(body);
  });

  return app;
}

module.exports = { createApp, JSON_TYPES };
