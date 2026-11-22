'use strict';

// Loads the official TMF620 v5.0.0 OAS (unchanged on disk) and adapts a copy in
// memory for this component: the server URL becomes the component's base path.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SPEC_FILE = path.join(__dirname, '..', 'api', 'TMF620-Product_Catalog_Management-v5.0.0.oas.yaml');
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

let cached;
function loadOfficialSpec() {
  if (!cached) cached = yaml.load(fs.readFileSync(SPEC_FILE, 'utf8'));
  return cached;
}

function basePathFor(componentName) {
  return `/${componentName}/tmf-api/productCatalogManagement/v5`;
}

// A deep copy with servers set to this component's base path.
function specForComponent(componentName) {
  const spec = structuredClone(loadOfficialSpec());
  spec.servers = [{ url: basePathFor(componentName) }];
  return spec;
}

// [{method, path, operationId}] for every operation in the spec.
function listOperations(spec) {
  const ops = [];
  for (const [p, item] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      if (item[method] && item[method].operationId) ops.push({ method, path: p, operationId: item[method].operationId });
    }
  }
  return ops;
}

// OAS path template to an Express route: /productOffering/{id} -> /productOffering/:id
function toExpressPath(oasPath) {
  return oasPath.replace(/\{([^}]+)\}/g, ':$1');
}

module.exports = { SPEC_FILE, loadOfficialSpec, basePathFor, specForComponent, listOperations, toExpressPath };
