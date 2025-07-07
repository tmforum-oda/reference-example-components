'use strict';

var fs = require('fs'),
    path = require('path'),
    jsyaml = require('js-yaml');

const {TError, TErrorEnum} = require('../utils/errorUtils');

var spec = null;
var swaggerDoc = null;

function getSwaggerDoc() {
  if(swaggerDoc==null) {
    // First try to load the modified spec with component name
    const modifiedSpecPath = path.join(__dirname,'../api/TMF672-Roles_And_Permissions-v5.0.0-modified.oas.yaml');
    if(fs.existsSync(modifiedSpecPath)) {
      spec = fs.readFileSync(modifiedSpecPath, 'utf8');
    } else {
      // Fallback to original spec
      spec = fs.readFileSync(path.join(__dirname,'../api/TMF672-Roles_And_Permissions-v5.0.0.oas.yaml'), 'utf8');
    }
    swaggerDoc = jsyaml.safeLoad(spec);
  };
  return swaggerDoc;
}

function getTypeDefinition(type) {
  var def;
  const meta = getSwaggerDoc();

  // For OAS3, components/schemas is used instead of definitions
  if(meta && meta.components && meta.components.schemas && meta.components.schemas[type]) {
    def = meta.components.schemas[type];
  } else if(meta && meta.definitions && meta.definitions[type]) {
    // Fallback for OAS2 style definitions
    def = meta.definitions[type];
  }
  return def;
}


function getResponseType(req) {
  // For OAS3 tools, we can extract the operation info from the request
  // This is a simplified version - may need adjustment based on actual usage
  var type;
  const swaggerDoc = getSwaggerDoc();
  
  // Try to get the path from the request URL
  if (req && req.route && req.route.path) {
    var pathPattern = req.route.path;
    
    if(swaggerDoc.paths && swaggerDoc.paths[pathPattern]) {
      var pathItem = swaggerDoc.paths[pathPattern];
      var method = req.method.toLowerCase();
      
      if(pathItem[method] && pathItem[method].responses) {
        var responses = pathItem[method].responses;
        var responseSchema;
        
        if(responses["201"] && responses["201"].content) {
          responseSchema = responses["201"].content["application/json"].schema;
        } else if(responses["200"] && responses["200"].content) {
          responseSchema = responses["200"].content["application/json"].schema;
        }
        
        if(responseSchema) {
          if(responseSchema.$ref) {
            type = responseSchema.$ref.split('/').slice(-1)[0];
          } else if(responseSchema.items && responseSchema.items.$ref) {
            type = responseSchema.items.$ref.split('/').slice(-1)[0];
          }
        }
      }
    }
  }
  
  return type;
}

// Simplified functions for OAS3 compatibility
function getPayloadType(req) {
  // In OAS3 tools, payload type is not needed as body is passed directly
  return null;
}

function getPayloadSchema(req) {
  // Simplified for OAS3 - schema validation is handled by the framework
  return undefined;
}

function getURLScheme() {
  const swaggerDoc = getSwaggerDoc();
  // OAS3 uses servers array instead of schemes
  if (swaggerDoc.servers && swaggerDoc.servers.length > 0) {
    return swaggerDoc.servers[0].url.split('://')[0];
  }
  return swaggerDoc.schemes ? swaggerDoc.schemes[0] : 'http';
}

function getHost() {
  const swaggerDoc = getSwaggerDoc();
  // OAS3 uses servers array instead of host
  if (swaggerDoc.servers && swaggerDoc.servers.length > 0) {
    const url = new URL(swaggerDoc.servers[0].url);
    return url.host;
  }
  return swaggerDoc.host || 'localhost';
}

function getBasePath() {
  const swaggerDoc = getSwaggerDoc();
  // OAS3 uses servers array with apiRoot variable
  if (swaggerDoc.servers && swaggerDoc.servers.length > 0) {
    const server = swaggerDoc.servers[0];
    if (server.variables && server.variables.apiRoot) {
      return '/' + server.variables.apiRoot.default;
    }
  }
  return swaggerDoc.basePath || '';
}

function getComponentName() {
  // Extract component name from environment variable or default naming
  const componentName = process.env.COMPONENT_NAME || 'r1-productcatalogmanagement';
  return componentName;
}

function buildComponentAwareURL(req, resourcePath = '') {
  // Use relative path const scheme = getURLScheme();
  // Use relative path const host = getHost();
  const basePath = getBasePath();
  
  // Clean up the resource path
  const cleanResourcePath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  
  // Build the full URL with component-aware base path
  const fullPath = `${basePath}${cleanResourcePath}`.replace(/\/+/g, '/');
  console.log(`Building component-aware relative URL: ${fullPath}`);
  return `${fullPath}`;
}

function updateHrefWithComponentName(href, req) {
  if (!href || typeof href !== 'string') {
    return href;
  }
  
  // If href is a relative path, convert to component-aware URL
  if (href.startsWith('/')) {
    return buildComponentAwareURL(req, href);
  }
  
  return href;
}

function hasProperty (obj, path) {
  var arr = path.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  return (obj !== undefined);
}

// Simplified service type functions for OAS3
const SERVICE_TYPE = "service_type";

function getRequestServiceType(req) {
  // In OAS3, parameters are passed directly to controller functions
  return undefined;
}

function updateQueryServiceType(query, req, idparam) {
  // Simplified for OAS3
  return query;
}

function updatePayloadServiceType(payload, req, idparam) {
  // Simplified for OAS3
  return payload;
}

function cleanPayloadServiceType(payload) {
  delete payload._serviceType;
  return payload;
}

function getPayload(req, body) {
  return new Promise(function(resolve, reject) {
    if (body) {
      resolve(body);
    } else if (req.body) {
      resolve(req.body);
    } else {
      reject(new Error("No payload found"));
    }
  });
}


module.exports = { 
                   getSwaggerDoc, 
                   getTypeDefinition,
                   getResponseType, 
				   				 getPayloadType, 
				   				 getPayloadSchema, 
				   				 getPayload, 
				   				 getURLScheme,
				   				 getHost,
				   				 getBasePath,
				   				 getComponentName,
				   				 buildComponentAwareURL,
				   				 updateHrefWithComponentName,

									 getRequestServiceType,
                   updateQueryServiceType,
                   updatePayloadServiceType,
                   cleanPayloadServiceType

				   			 };