'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const swaggerUI = require('swagger-ui-express');
const jsYaml = require('js-yaml');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const OpenApiValidator = require('express-openapi-validator');
const logger = require('./logger');
const config = require('./config');

const { getBasePath } = require('./utils/swaggerUtils');
const { entrypoint } = require('./utils/entrypoint');

const cleanPath = (p) => p.replace(/\/\//, '/');

//
// Injects the COMPONENT_NAME environment variable as a path prefix into servers[0].url.
// Writes the modified spec back to disk so express-openapi-validator reads the correct paths.
//
function updateAPISpecification(schema, specPath) {
  const componentName = (process.env.COMPONENT_NAME || 'r1-resourcecatalogmanagement').replace(/^\/+|\/+$/g, '');

  if (schema.servers && schema.servers[0]) {
    try {
      const serverUrl = schema.servers[0].url;
      const url = new URL(serverUrl);
      const pathname = url.pathname.replace(/^\/+/, '');

      // only prepend if not already prefixed
      if (!pathname.startsWith(componentName)) {
        // ensure ODA Canvas convention: /{componentName}/tmf-api/{apiPath}
        const normalizedPath = pathname.startsWith('tmf-api/')
          ? pathname
          : 'tmf-api/' + pathname.replace(/^\/+/, '');
        url.pathname = '/' + componentName + '/' + normalizedPath;
        schema.servers[0].url = url.toString();
        fs.writeFileSync(specPath, jsYaml.dump(schema));
      }
    } catch (e) {
      logger.error('updateAPISpecification: failed to update server URL', e.message);
    }
  }
}

class ExpressServer {
  constructor(port, openApiYaml) {
    this.port = port;
    this.app = express();
    this.openApiPath = openApiYaml;

    try {
      this.schema = jsYaml.load(fs.readFileSync(openApiYaml));
      updateAPISpecification(this.schema, openApiYaml);
    } catch (e) {
      logger.error('failed to start Express Server', e.message);
    }

    this.setupMiddleware();
  }

  setupMiddleware() {
    const basePath = getBasePath().replace(/\/$/, '');

    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.text());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());

    this.app.get('/hello', (req, res) => res.send('Hello World'));

    // Serve raw spec
    this.app.get(cleanPath(basePath + '/openapi'), (req, res) =>
      res.sendFile(path.join(__dirname, 'api', 'openapi.yaml')));

    // Serve swagger UI
    this.app.use(cleanPath(basePath + '/api-docs'), swaggerUI.serve, swaggerUI.setup(this.schema));

    // Redirect helpers
    this.app.get('/api-docs', (req, res) => res.redirect(cleanPath(basePath + '/api-docs')));
    this.app.get('/', (req, res) => res.redirect(cleanPath(basePath + '/entrypoint')));
    this.app.get(cleanPath(basePath + '/'), (req, res) => res.redirect(cleanPath(basePath + '/entrypoint')));

    // TMF630-compliant API entrypoint (lists all operations as _links)
    this.app.use(cleanPath(basePath + '/entrypoint'), entrypoint);
  }

  launch() {
    try {
      this.app.use(OpenApiValidator.middleware({
        apiSpec: this.openApiPath,
        operationHandlers: path.join(__dirname),
        validateRequests: false,
        validateResponses: false,
        unknownFormats: ['base64']
      }));

      this.app.use((err, req, res, next) => {
        res.status(err.status || 500).json({
          message: err.message || err,
          errors: err.errors || ''
        });
      });

      const server = http.createServer(this.app);
      server.listen(this.port);

      logger.info('Listening on port ' + this.port);

    } catch (e) {
      logger.error('launch error: ' + e);
    }
  }

  async close() {
    if (this.server !== undefined) {
      await this.server.close();
      logger.info('Server on port ' + this.port + ' shut down');
    }
  }
}

module.exports = ExpressServer;
