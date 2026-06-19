'use strict';

const logger = require('../logger');
const { getSwaggerDoc } = require('../utils/swaggerUtils');

function entrypoint(req, res) {
  const swaggerDoc = getSwaggerDoc();

  try {
    const basePath = swaggerDoc?.servers?.[0]?.url || swaggerDoc.basePath;
    if (!basePath) throw new Error('server implementation error');

    const cleanPath = (path) => path.replace(/\/\//, '/');

    var linksObject = {};
    linksObject.self = {
      href: basePath,
      'swagger-ui': cleanPath(basePath + '/api-docs'),
      openapi: cleanPath(basePath + '/openapi')
    };

    for (var infoKey in swaggerDoc.info) {
      linksObject.self[infoKey] = swaggerDoc.info[infoKey];
    }

    for (var pathKey in swaggerDoc.paths) {
      for (var methodKey in swaggerDoc.paths[pathKey]) {
        linksObject[swaggerDoc.paths[pathKey][methodKey].operationId] = {
          href: stripTrailingSlash(basePath) + pathKey,
          method: methodKey.toUpperCase(),
          description: swaggerDoc.paths[pathKey][methodKey].description
        };
      }
    }

    res.end(JSON.stringify({ _links: linksObject }, null, 2));
  } catch (error) {
    logger.error('Return 404 error for url ' + req?.url);
    res.statusCode = 404;
    res.end('Endpoint details not available');
  }
}

function stripTrailingSlash(str) {
  return str?.replace(/\/$/, '') || str;
}

module.exports = { entrypoint };
