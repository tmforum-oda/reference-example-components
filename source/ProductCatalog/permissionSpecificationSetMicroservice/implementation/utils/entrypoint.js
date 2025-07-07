'use strict';

const {getSwaggerDoc} = require('../utils/swaggerUtils');

//
// The EntryPoint is the equivalent of the home-page for the API.
//

function entrypoint(req, res) {
  const swaggerDoc = getSwaggerDoc();
  
  try {
    // For OAS3, construct basePath from server URL template
    let basePath = '';
    if (swaggerDoc?.servers?.[0]?.url) {
      // Get the server URL template and extract the path part
      const serverUrl = swaggerDoc.servers[0].url;
      const apiRoot = swaggerDoc.servers[0].variables?.apiRoot?.default || '';
      
      // The apiRoot already includes the component name from the modification in index.js
      basePath = `/${apiRoot}`;
    } else if (swaggerDoc.basePath) {
      // Fallback to OAS2 style basePath
      basePath = swaggerDoc.basePath;
    }

    if (!basePath) {
      throw new Error('Unable to determine API base path');
    }

    const cleanPath = (path) => path.replace(/\/+/g, '/');
      // For Express routes, we need to check if this is the base path
    const requestPath = req.path || req.url;
    const isBasePath = requestPath === basePath || requestPath === basePath + '/' || requestPath === '/';
    
    if (isBasePath) {
      var linksObject = {};
      linksObject.self = {
        "href": basePath,
        "openapi": cleanPath(`${basePath}/api-docs`),
        "swagger-ui": cleanPath(`${basePath}/docs`)
      };

      // add swagger info details to self link
      for (var infoKey in swaggerDoc.info) {
        linksObject.self[infoKey] = swaggerDoc.info[infoKey];
      }

      // go through every operation in every path to create additional links
      for (var pathKey in swaggerDoc.paths) {
        for (var methodKey in swaggerDoc.paths[pathKey]) {
          const operation = swaggerDoc.paths[pathKey][methodKey];
          if (operation.operationId) {
            linksObject[operation.operationId] = {
              "href": stripTrailingSlash(basePath) + pathKey,
              "method": methodKey.toUpperCase(),
              "description": operation.description || operation.summary || ''
            };
          }
        }
      }

      var responseJSON = {
        "_links": linksObject
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(responseJSON, null, 2));  
    } else {
      console.log('Return 404 error for url ' + req.url);
      res.statusCode = 404;
      res.end('Endpoint not found. Try ' + basePath);
    }
  } catch (error) {
    console.error('Entrypoint error:', error);
    res.statusCode = 500;
    res.end('Internal server error');
  }
}

function stripTrailingSlash(str) {
  if (str.substr(-1) === '/') {
    return str.substr(0, str.length - 1);
  }
  return str;
}

module.exports = { entrypoint };
