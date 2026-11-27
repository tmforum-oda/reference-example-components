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

// The spec without its examples, for express-openapi-validator. The validator puts
// components into every schema it compiles, and Ajv (draft-04 rules, as for OAS 3.0)
// reads the `id` attributes of the example payloads as schema ids; the official
// examples reuse ids (for example '9881'), which makes every response validator fail
// with "resolves to more than one schema".
function withoutExamples(spec) {
  const copy = structuredClone(spec);
  if (copy.components) delete copy.components.examples;
  const strip = (node) => {
    if (Array.isArray(node)) { node.forEach(strip); return; }
    if (!node || typeof node !== 'object') return;
    if (node.content && typeof node.content === 'object') {
      Object.values(node.content).forEach(media => { if (media) { delete media.examples; delete media.example; } });
    }
    Object.values(node).forEach(strip);
  };
  strip(copy.paths);
  strip(copy.components);
  return copy;
}

// The TMF620 v5.0.0 OAS models "reference or value" and "party or party role" as
// oneOf + discriminator (for example PartyRefOrPartyRoleRef: PartyRef | PartyRoleRef).
// The branches do not exclude each other's attributes, so a plain JSON Schema
// validator finds that a PartyRef also matches PartyRoleRef and refuses the
// document ("must match exactly one schema in oneOf"): every relatedParty would be
// refused. This applies the discriminator: each branch only matches its own @type
// values from the mapping. An @type outside the mapping (a TMF extension subtype,
// matrix G3) must match at least one branch.
function withDiscriminatedOneOf(spec) {
  const copy = structuredClone(spec);
  const schemas = (copy.components && copy.components.schemas) || {};
  for (const name of Object.keys(schemas)) {
    const schema = schemas[name];
    if (!Array.isArray(schema.oneOf) || !schema.discriminator || !schema.discriminator.mapping) continue;
    const prop = schema.discriminator.propertyName;
    const mapping = schema.discriminator.mapping;
    const all = Object.keys(mapping);
    const branches = schema.oneOf.map(branch => {
      const values = all.filter(k => mapping[k] === branch.$ref);
      if (!values.length) return branch;
      return { allOf: [branch, { type: 'object', required: [prop], properties: { [prop]: { enum: values } } }] };
    });
    branches.push({ allOf: [
      { type: 'object', required: [prop], properties: { [prop]: { not: { enum: all } } } },
      { anyOf: schema.oneOf }
    ] });
    schema.oneOf = branches;
    // enforced by the branches now; express-openapi-validator's own discriminator
    // handling is meant for top-level request bodies and misreads nested ones
    delete schema.discriminator;
  }
  return copy;
}

// TMF630 writes lists in query values with plain commas (fields=name,lifecycleStatus),
// but the OAS query parameters leave allowReserved at false, so the validator would
// refuse every unencoded comma. This allows reserved characters in query values.
function withReservedQueryValues(spec) {
  const copy = structuredClone(spec);
  const allow = (params) => (params || []).forEach(p => { if (p && p.in === 'query') p.allowReserved = true; });
  allow(Object.values((copy.components && copy.components.parameters) || {}));
  Object.values(copy.paths || {}).forEach(item => {
    allow(item.parameters);
    HTTP_METHODS.forEach(m => item[m] && allow(item[m].parameters));
  });
  return copy;
}

// What express-openapi-validator gets: the official spec, without examples, with
// discriminated oneOfs and with reserved characters allowed in query values
function validatorSpec(spec) {
  return withReservedQueryValues(withDiscriminatedOneOf(withoutExamples(spec)));
}

module.exports = {
  withoutExamples,
  withDiscriminatedOneOf,
  withReservedQueryValues,
  validatorSpec, SPEC_FILE, loadOfficialSpec, basePathFor, specForComponent, listOperations, toExpressPath };
