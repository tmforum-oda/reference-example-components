'use strict';

// TMF620 v4 API on TMF620 v5 storage (issue #87, spec sections 5-7).
//
// The documents in MongoDB are TMF620 v5.0.0 resources, shared with the v5 API.
// This module is the v4 service's persistence boundary: v4 payloads are translated
// to v5 before they are written, stored documents are translated to v4 before they
// are returned, and whatever cannot be translated is refused or reported with the
// codes of the compatibility matrix.

const compat = require('tmf620-compat');
const metrics = require('./compatMetrics');

const RESOURCE_BY_TYPE = {
  Catalog: 'catalog',
  Category: 'category',
  ProductOffering: 'productOffering',
  ProductOfferingPrice: 'productOfferingPrice',
  ProductSpecification: 'productSpecification'
};

function componentName() {
  return process.env.COMPONENT_NAME || 'r1-productcatalogmanagement';
}

function v4BasePath() { return `/${componentName()}/tmf-api/productCatalogManagement/v4`; }
function v5BasePath() { return `/${componentName()}/tmf-api/productCatalogManagement/v5`; }

function ctx() {
  return { componentName: componentName(), v4BaseUrl: v4BasePath() };
}

function resourceOf(resourceType) {
  return RESOURCE_BY_TYPE[resourceType];
}

// Documents written before the v5 storage format have no marker (spec section 8).
function isV5(doc) {
  return !!doc && doc._schema === compat.STORAGE_SCHEMA;
}

// v4 payload -> {doc, problems, warnings}; doc is ready to insert
function toStorage(resource, v4payload) {
  const r = compat.v4ToV5(resource, v4payload, ctx());
  if (r.doc) r.doc._schema = compat.STORAGE_SCHEMA;
  return r;
}

// stored document -> {doc, warnings}; legacy (unmigrated) documents are returned as they are
function toV4View(resource, stored) {
  if (!isV5(stored)) {
    const doc = Object.assign({}, stored);
    delete doc._schema;
    return { doc, warnings: [] };
  }
  const internal = {};
  Object.keys(stored).forEach(k => { if (k.charAt(0) === '_') internal[k] = stored[k]; });
  const r = compat.v5ToV4(resource, stored, ctx());
  // keep the service's own internal fields (removed later by sendDoc / cleanPayloadServiceType)
  if (internal._serviceType !== undefined) r.doc._serviceType = internal._serviceType;
  return { doc: r.doc, warnings: r.warnings, omitted: r.omitted };
}

// PATCH: stored document + v4 merge patch -> {doc, problems, warnings}; doc is ready to replace the stored one
function patchStorage(resource, stored, v4patch) {
  let base = stored;
  if (!isV5(stored)) {
    // not migrated yet: translate the whole stored document first
    const legacy = Object.assign({}, stored);
    delete legacy._id;
    const r = compat.v4ToV5(resource, compat.mergePatch(legacy, v4patch), ctx());
    if (r.problems.length) return { doc: undefined, problems: r.problems, warnings: r.warnings };
    base = r.doc;
    base._schema = compat.STORAGE_SCHEMA;
    return { doc: base, problems: [], warnings: r.warnings };
  }
  const r = compat.v4Patch(resource, stored, v4patch, ctx());
  if (r.doc) {
    delete r.doc._id;
    r.doc._schema = compat.STORAGE_SCHEMA;
  }
  return r;
}

// List query (v4 names) -> {query (v5 storage names), fields, problems}
function mapQuery(resource, params) {
  const filter = compat.mapFilter(resource, params);
  const problems = filter.problems.slice();
  const query = filter.query;
  let v4Fields;
  if (query.fields !== undefined) {
    v4Fields = String(params.fields).split(',').map(f => f.trim().split('.')[0]).filter(Boolean);
    const f = compat.mapFields(resource, query.fields);
    problems.push(...f.problems);
    if (f.fields) {
      // also needed to build the v4 view
      const needed = f.fields.split(',').concat(['_schema', '@type']);
      query.fields = Array.from(new Set(needed)).join(',');
    } else {
      delete query.fields;
    }
  }
  return { query, problems, v4Fields };
}

// With ?fields=, return only what was asked for (plus id and href), as before #87
function projectView(doc, v4Fields) {
  if (!v4Fields || !v4Fields.length) return doc;
  const keep = v4Fields.concat(['id', 'href', '_serviceType']);
  Object.keys(doc).forEach(k => { if (keep.indexOf(k) < 0) delete doc[k]; });
  return doc;
}

// Query string helpers (operators such as >= stay in the key, as query-to-mongo expects)
function parseQueryString(qs) {
  const out = {};
  if (!qs) return out;
  qs.split('&').forEach(part => {
    if (!part) return;
    const i = part.indexOf('=');
    const k = decodeURIComponent((i < 0 ? part : part.slice(0, i)).replace(/\+/g, ' '));
    const v = i < 0 ? '' : decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
    out[k] = v;
  });
  return out;
}

function stringifyQuery(query) {
  return Object.keys(query).map(k => {
    const key = encodeURIComponent(k).replace(/%3C/gi, '<').replace(/%3E/gi, '>').replace(/%21/g, '!').replace(/%40/g, '@');
    return `${key}=${encodeURIComponent(query[k])}`;
  }).join('&');
}

// ---------------------------------------------------------------------------
// Errors and warnings on the wire

function logCompat(level, message) {
  if (level === 'warn') console.warn(message); else console.log(message);
}

function sendProblems(res, problems, resource, id, operation) {
  const e = compat.toTmfError(problems, { resource, id, operation, v5Path: `${v5BasePath()}/${resource === 'catalog' ? 'productCatalog' : resource}` });
  logCompat('warn', `TMF620 compatibility: ${operation} ${resource}${id ? '/' + id : ''} refused with ${e.status}: ${problems.map(p => p.code + ' ' + p.path).join(', ')}`);
  metrics.reporter().recordAll(problems, resource, operation === 'filter' ? 'filter' : operation);
  res.statusCode = e.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(e.body));
}

// Collected warnings of one response, for several documents in a list
function warningCollector(resource, operation) {
  const items = [];
  return {
    add(warnings, id) { (warnings || []).forEach(w => items.push({ code: w.code, path: w.path, id })); },
    apply(res) {
      if (!items.length) return;
      const byId = {};
      items.forEach(w => { (byId[w.id] = byId[w.id] || []).push(w); });
      const headers = [];
      Object.keys(byId).forEach(id => headers.push(...compat.warningHeaders(byId[id], resource, id)));
      res.setHeader('X-TMF-Compatibility-Warning', headers);
      logCompat('warn', `TMF620 compatibility: ${operation} ${resource}: ${headers.length} warning(s): ${headers.map(h => h.split('; see=')[0]).join(' | ')}`);
      metrics.reporter().recordAll(items, resource, operation);
    }
  };
}

module.exports = {
  RESOURCE_BY_TYPE,
  resourceOf,
  isV5,
  toStorage,
  toV4View,
  patchStorage,
  mapQuery,
  projectView,
  parseQueryString,
  stringifyQuery,
  sendProblems,
  warningCollector,
  v4BasePath,
  v5BasePath
};
