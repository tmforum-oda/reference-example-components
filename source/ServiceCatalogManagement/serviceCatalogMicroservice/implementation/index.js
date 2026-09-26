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
  componentName = 'r1-servicecatalogmanagement'; // local testing default
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
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d%sdocs', serverPort, swaggerDoc.basePath);
  });
});

function errorHandler(err, req, res, next) {
  if (err && err.failedValidation) {
    const internalError = new TError(TErrorEnum.INVALID_INPUT_VALUE, err.message);
    sendError(res, internalError);
  } else {
    next(err);
  }
}
