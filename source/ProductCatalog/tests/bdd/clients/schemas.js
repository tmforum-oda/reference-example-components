'use strict';

// Response validation against each version's own API specification (spec 10.1):
// the v4 client checks every response against the TMF620 v4.0.0 Swagger the v4
// service publishes, the v5 client against the official TMF620 v5.0.0 OAS. So a v4
// client fails if the translator ever returns v5-shaped data, and the reverse.
//
// Two adjustments, both documented in the compatibility matrix and upstream drafts:
// - v5: the "ref or value" oneOf schemas are made exclusive by @type (their
//   discriminator), otherwise a PartyRef also matches PartyRoleRef and every
//   relatedParty fails "must match exactly one schema in oneOf".
// - v4: format "uri" accepts URI references. The v4 service has always returned a
//   relative @schemaLocation ("/docs/#/") and relative hrefs.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const SOURCE = path.join(__dirname, '..', '..', '..');
const SPEC_FILES = {
  v4: process.env.TMF620_V4_SPEC || path.join(SOURCE, 'productCatalogV4Microservice', 'implementation', 'api', 'swagger.yaml'),
  v5: process.env.TMF620_V5_SPEC || path.join(SOURCE, 'productCatalogV5Microservice', 'implementation', 'api', 'TMF620-Product_Catalog_Management-v5.0.0.oas.yaml')
};

// Resource schema per version
const SCHEMA_NAMES = {
  v4: { catalog: 'Catalog', category: 'Category', productOffering: 'ProductOffering', productOfferingPrice: 'ProductOfferingPrice', productSpecification: 'ProductSpecification' },
  v5: { catalog: 'ProductCatalog', category: 'Category', productOffering: 'ProductOffering', productOfferingPrice: 'ProductOfferingPrice', productSpecification: 'ProductSpecification' }
};

function discriminateOneOf(schemas) {
  for (const name of Object.keys(schemas)) {
    const schema = schemas[name];
    if (!Array.isArray(schema.oneOf) || !schema.discriminator || !schema.discriminator.mapping) continue;
    const prop = schema.discriminator.propertyName;
    const mapping = schema.discriminator.mapping;
    const all = Object.keys(mapping);
    const branches = schema.oneOf.map(branch => {
      const values = all.filter(k => mapping[k] === branch.$ref);
      return values.length ? { allOf: [branch, { required: [prop], properties: { [prop]: { enum: values } } }] } : branch;
    });
    branches.push({ allOf: [{ required: [prop], properties: { [prop]: { not: { enum: all } } } }, { anyOf: schema.oneOf }] });
    schema.oneOf = branches;
    delete schema.discriminator;
  }
  return schemas;
}

function createAjv(version) {
  const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false });
  addFormats(ajv);
  ajv.addFormat('base64', /^[A-Za-z0-9+/]*={0,2}$/);
  if (version === 'v4') ajv.addFormat('uri', ajv.formats['uri-reference']);
  return ajv;
}

const cache = {};

function loadValidators(version) {
  if (cache[version]) return cache[version];
  const doc = yaml.load(fs.readFileSync(SPEC_FILES[version], 'utf8'));
  const ajv = createAjv(version);
  if (version === 'v4') {
    ajv.addSchema({ $id: 'tmf620v4', definitions: doc.definitions });
  } else {
    ajv.addSchema({ $id: 'tmf620v5', components: { schemas: discriminateOneOf(doc.components.schemas) } });
  }
  const ref = name => (version === 'v4' ? `tmf620v4#/definitions/${name}` : `tmf620v5#/components/schemas/${name}`);
  const compiled = {};
  const get = name => {
    if (!compiled[name]) compiled[name] = ajv.getSchema(ref(name)) || ajv.compile({ $ref: ref(name) });
    return compiled[name];
  };
  cache[version] = { get, ajv, file: SPEC_FILES[version] };
  return cache[version];
}

function describe(errors) {
  return (errors || []).slice(0, 10).map(e => `${e.instancePath || '(root)'} ${e.message}${e.params && e.params.allowedValues ? ' ' + JSON.stringify(e.params.allowedValues) : ''}`);
}

// Returns a list of problems (empty when the body is valid)
function validate(version, schemaName, body) {
  const v = loadValidators(version).get(schemaName);
  if (Array.isArray(body)) {
    return body.reduce((all, item, i) => all.concat(v(item) ? [] : describe(v.errors).map(e => `[${i}]${e}`)), []);
  }
  return v(body) ? [] : describe(v.errors);
}

function validateResource(version, resource, body) {
  return validate(version, SCHEMA_NAMES[version][resource], body);
}

module.exports = { validate, validateResource, SCHEMA_NAMES, SPEC_FILES, discriminateOneOf };
