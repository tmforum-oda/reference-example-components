'use strict';

// TMF620 v5 create / list / retrieve / patch / delete on the collections shared
// with the v4 API (issue #87, task T10).
//
// The stored document is the v5 resource itself, so no translation is needed:
//   - internal fields start with '_' (_id, _schema) and are never returned
//   - hrefs to this catalogue are stored version-neutral (/<resource>/<id>) and
//     built from the v5 base path in every response
//   - documents without the _schema marker were written by an older v4 service and
//     not migrated yet (spec section 8); they are refused with 500, not served as v5

const crypto = require('crypto');
const compat = require('tmf620-compat');
const { sendError } = require('../utils/tmfError');
const { buildQuery, projectDoc } = require('../utils/query');
const { applyJsonPatch } = require('../utils/jsonPatch');

// v5 resource name -> {key (shared module resource), collection (shared with v4)}
const RESOURCES = {
  ProductCatalog: { key: 'catalog', collection: 'Catalog', segment: 'productCatalog' },
  Category: { key: 'category', collection: 'Category', segment: 'category' },
  ProductOffering: { key: 'productOffering', collection: 'ProductOffering', segment: 'productOffering' },
  ProductOfferingPrice: { key: 'productOfferingPrice', collection: 'ProductOfferingPrice', segment: 'productOfferingPrice' },
  ProductSpecification: { key: 'productSpecification', collection: 'ProductSpecification', segment: 'productSpecification' }
};

const DEFAULT_LIFECYCLE_STATUS = 'In design';   // the same default as the v4 API (#80)

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// S5: the OAS validator does not check value against the @type of a
// characteristic value specification, so every one in the document is checked here.
function charValueProblems(node, path, out) {
  out = out || [];
  if (Array.isArray(node)) { node.forEach((n, i) => charValueProblems(n, `${path}[${i}]`, out)); return out; }
  if (!isObject(node)) return out;
  if (typeof node['@type'] === 'string' && /CharacteristicValueSpecification$/.test(node['@type'])) {
    const err = compat.checkV5Value(node);
    if (err) out.push(`${path}: ${err}`);
  }
  Object.keys(node).forEach(k => charValueProblems(node[k], path ? `${path}.${k}` : k, out));
  return out;
}

function createHandlers(options) {
  const store = options.store;
  const componentName = options.componentName;
  const basePath = `/${componentName}/tmf-api/productCatalogManagement/v5`;

  function toResponse(stored, fields) {
    const doc = JSON.parse(JSON.stringify(stored));
    Object.keys(doc).forEach(k => { if (k.charAt(0) === '_') delete doc[k]; });
    compat.mapHrefs(doc, h => compat.buildHref(h, 'v5', basePath));
    return projectDoc(doc, fields);
  }

  function unmigrated(res, info, ids) {
    sendError(res, 500, 'TMF620-V5-500-UNMIGRATED', 'Stored data is not in the TMF620 v5 format yet',
      `${info.key} ${ids.join(', ')} ${ids.length > 1 ? 'were' : 'was'} written by an older Product Catalog v4 service and ${ids.length > 1 ? 'have' : 'has'} not been migrated to the v5 storage format. ` +
      'The v4 API migrates all stored documents when it starts (spec section 8); restart it, or read the resource through the v4 API.');
  }

  function failed(res, err, what) {
    console.error(`${what}: ${err.stack || err.message}`);
    sendError(res, 503, 'TMF620-V5-503', 'Database unavailable', `${what} failed: ${err.message}`);
  }

  function prepare(info, resourceName, doc) {
    if (resourceName === 'ProductCatalog' && doc['@baseType'] === undefined) doc['@baseType'] = 'Catalog';   // matrix G1
    if (doc.lifecycleStatus === undefined) doc.lifecycleStatus = DEFAULT_LIFECYCLE_STATUS;
    doc.lastUpdate = new Date().toISOString();
    compat.mapHrefs(doc, h => compat.normaliseHref(h, componentName));
    doc.href = `/${info.key}/${doc.id}`;
    doc._schema = compat.STORAGE_SCHEMA;
    return doc;
  }

  function refuseValues(res, problems) {
    // 400: the v5.0.0 OAS defines no 422 response
    sendError(res, 400, 'TMF620-V5-400-CHARVALUE-TYPE', 'Characteristic value does not fit its @type',
      `${problems.length} characteristic value${problems.length > 1 ? 's do' : ' does'} not fit the declared @type: ${problems.join('; ')}`,
      { referenceError: 'https://github.com/tmforum-oda/reference-example-components/blob/master/specs/87-productcatalog-tmf620-v4-v5/compatibility-matrix.md#s5' });
  }

  const handlers = {};

  for (const resourceName of Object.keys(RESOURCES)) {
    const info = RESOURCES[resourceName];

    handlers['create' + resourceName] = async (req, res) => {
      const doc = JSON.parse(JSON.stringify(req.body));
      const problems = charValueProblems(doc, '');
      if (problems.length) return refuseValues(res, problems);
      if (doc.id === undefined) doc.id = crypto.randomUUID();
      try {
        if (await store.findOne(info.collection, { id: doc.id })) {
          return sendError(res, 409, 'TMF620-V5-409', 'Resource already exists', `${info.key} ${doc.id} already exists`);
        }
        prepare(info, resourceName, doc);
        await store.insert(info.collection, doc);
      } catch (err) { return failed(res, err, 'create ' + info.key); }
      const body = toResponse(doc);
      res.status(201).location(body.href).json(body);
    };

    handlers['retrieve' + resourceName] = async (req, res) => {
      const q = buildQuery(req.originalUrl.split('?')[1]);
      let doc;
      try { doc = await store.findOne(info.collection, { id: req.params.id }); } catch (err) { return failed(res, err, 'retrieve ' + info.key); }
      if (!doc) return sendError(res, 404, 'TMF620-V5-404', 'Resource not found', `No ${info.key} with id ${req.params.id}`);
      if (doc._schema !== compat.STORAGE_SCHEMA) return unmigrated(res, info, [doc.id]);
      res.json(toResponse(doc, q.options.fields));
    };

    handlers['list' + resourceName] = async (req, res) => {
      const q = buildQuery(req.originalUrl.split('?')[1]);
      if (q.problems.length) return sendError(res, 400, 'TMF620-V5-400', 'Invalid query', q.problems.join('; '));
      let docs, total;
      try {
        total = await store.count(info.collection, q.criteria);
        docs = await store.find(info.collection, q.criteria, { skip: q.options.skip, limit: q.options.limit, sort: q.options.sort, projection: q.options.projection });
      } catch (err) { return failed(res, err, 'list ' + info.key); }
      const legacy = docs.filter(d => d._schema !== compat.STORAGE_SCHEMA).map(d => d.id);
      if (legacy.length) return unmigrated(res, info, legacy);
      res.set('X-Total-Count', String(total));
      res.set('X-Result-Count', String(docs.length));
      res.status(200).json(docs.map(d => toResponse(d, q.options.fields)));
    };

    handlers['patch' + resourceName] = async (req, res) => {
      const type = (req.headers['content-type'] || 'application/json').split(';')[0].trim();
      if (type === 'application/json-patch-query+json') {
        return sendError(res, 501, 'TMF620-V5-501', 'JSON Patch Query not implemented',
          'This reference implementation supports application/merge-patch+json, application/json and application/json-patch+json');
      }
      let stored;
      try { stored = await store.findOne(info.collection, { id: req.params.id }); } catch (err) { return failed(res, err, 'patch ' + info.key); }
      if (!stored) return sendError(res, 404, 'TMF620-V5-404', 'Resource not found', `No ${info.key} with id ${req.params.id}`);
      if (stored._schema !== compat.STORAGE_SCHEMA) return unmigrated(res, info, [stored.id]);

      const current = JSON.parse(JSON.stringify(stored));
      const internal = {};
      Object.keys(current).forEach(k => { if (k.charAt(0) === '_') { internal[k] = current[k]; delete current[k]; } });

      let patched;
      if (type === 'application/json-patch+json') {
        const r = applyJsonPatch(current, req.body);
        if (r.error) return sendError(res, r.status, `TMF620-V5-${r.status}`, r.status === 409 ? 'Patch test failed' : 'Patch cannot be applied', r.error);
        patched = r.doc;
      } else {
        patched = compat.mergePatch(current, req.body);
      }
      if (!isObject(patched)) return sendError(res, 400, 'TMF620-V5-400', 'Patch cannot be applied', 'the result is not an object');
      if (patched.id !== stored.id) return sendError(res, 400, 'TMF620-V5-400', 'id cannot be changed', `id is ${stored.id}`);
      const problems = charValueProblems(patched, '');
      if (problems.length) return refuseValues(res, problems);

      prepare(info, resourceName, patched);
      if (internal._serviceType !== undefined) patched._serviceType = internal._serviceType;
      try { await store.replace(info.collection, { id: stored.id }, patched); } catch (err) { return failed(res, err, 'patch ' + info.key); }
      res.status(200).json(toResponse(patched));
    };

    handlers['delete' + resourceName] = async (req, res) => {
      let n;
      try { n = await store.remove(info.collection, { id: req.params.id }); } catch (err) { return failed(res, err, 'delete ' + info.key); }
      if (!n) return sendError(res, 404, 'TMF620-V5-404', 'Resource not found', `No ${info.key} with id ${req.params.id}`);
      res.status(204).end();
    };
  }

  return handlers;
}

module.exports = { createHandlers, RESOURCES, charValueProblems };
