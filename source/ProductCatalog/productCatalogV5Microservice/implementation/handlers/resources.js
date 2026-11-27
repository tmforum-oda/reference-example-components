'use strict';

// TMF620 v5 create / list / retrieve / patch / delete on the collections shared
// with the v4 API (issue #87, task T10).
//
// The stored document is the v5 resource itself, so no translation is needed:
//   - internal fields start with '_' (_id, _schema) and are never returned
//   - hrefs to this catalogue are stored version-neutral (/<resource>/<id>) and
//     built from the v5 base path in every response
//   - documents without the _schema marker were written by an older v4 service
//     (spec section 8). The v4 API migrates them when it starts; one written after
//     that (for example by the previous v4 pod during a rolling upgrade) is migrated
//     here, with the same code, the first time a GET, PATCH or list meets it. Only a
//     document that cannot be converted is refused (500) on a GET or PATCH and left
//     out of lists, so it is never served as v5

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

const DEFAULT_LIFECYCLE_STATUS = compat.DEFAULT_LIFECYCLE_STATUS;   // the same default as the v4 API (#80)

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
  const reporter = options.reporter || { record() {}, recordAll() {} };
  const log = options.log || (m => console.log(m));
  // Documents that could not be converted, by content: logged and counted once, and
  // tried again only when their content changes (for example after a fix through v4)
  const unconvertible = new Map();

  // A stored document in the v4 format -> {doc} (now stored in the v5 format) or {problems}
  async function migrateOne(info, stored) {
    if (stored.id === undefined || stored.id === null) {
      return { problems: [{ path: 'id', detail: 'the stored document has no id' }] };
    }
    const key = `${info.collection}/${stored._id}`;
    const fingerprint = crypto.createHash('sha1').update(JSON.stringify(stored)).digest('hex');
    const known = unconvertible.get(key);
    if (known && known.fingerprint === fingerprint) return { problems: known.problems };

    const r = compat.migrateStored(info.key, stored, { componentName });
    if (!r.doc) {
      unconvertible.set(key, { fingerprint, problems: r.problems });
      log(`TMF620 migration (v5 API): ${info.key}/${stored.id} cannot be converted and is left unchanged: ${compat.describeProblems(r.problems)}`);
      reporter.recordAll(r.problems, info.key, 'migration');
      return { problems: r.problems };
    }
    if (r.quarantine) await store.upsert(compat.QUARANTINE, { resourceType: info.collection, id: stored.id }, r.quarantine);
    const matched = await store.replace(info.collection, Object.assign({ _id: stored._id }, compat.NOT_MIGRATED), r.doc);
    if (!matched) {
      // converted meanwhile by the v4 API or another replica
      const now = await store.findOne(info.collection, { _id: stored._id });
      if (compat.isMigrated(now)) return { doc: now };
      return { problems: [{ path: 'id', detail: 'the stored document changed while it was being converted; try again' }] };
    }
    unconvertible.delete(key);
    const notes = [];
    if (r.quarantined.length) notes.push(`moved ${r.quarantined.map(q => q.path).join(', ')} to ${compat.QUARANTINE} (TMF620 v5 has no equivalent)`);
    if (r.defaulted) notes.push(`lifecycleStatus set to "${DEFAULT_LIFECYCLE_STATUS}" (it had none)`);
    log(`TMF620 migration (v5 API): ${info.key}/${stored.id} converted to the v5 storage format${notes.length ? ': ' + notes.join('; ') : ''}`);
    if (r.quarantined.length) reporter.record('W-V4ONLY-QUARANTINED', info.key, 'migration', r.quarantined.length);
    return { doc: Object.assign({ _id: stored._id }, r.doc) };
  }

  // Converts every document of the collection still in the v4 format (normally none);
  // returns how many could not be converted
  async function migratePending(info) {
    const pending = await store.find(info.collection, compat.NOT_MIGRATED, {});
    let left = 0;
    for (const stored of pending) { if ((await migrateOne(info, stored)).problems) left++; }
    return left;
  }

  function toResponse(stored, fields) {
    const doc = JSON.parse(JSON.stringify(stored));
    Object.keys(doc).forEach(k => { if (k.charAt(0) === '_') delete doc[k]; });
    compat.mapHrefs(doc, h => compat.buildHref(h, 'v5', basePath));
    return projectDoc(doc, fields);
  }

  function unmigrated(res, info, id, problems) {
    sendError(res, 500, 'TMF620-V5-500-UNMIGRATED', 'Stored data cannot be converted to the TMF620 v5 format',
      `${info.key} ${id} was written by an older Product Catalog v4 service and cannot be converted to the v5 storage format: ` +
      `${compat.describeProblems(problems)}. The v4 API still serves it: correct it through the v4 API (it is converted the next time it is read here), or delete it.`);
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
      if (!compat.isMigrated(doc)) {
        let m;
        try { m = await migrateOne(info, doc); } catch (err) { return failed(res, err, 'retrieve ' + info.key); }
        if (m.problems) return unmigrated(res, info, doc.id, m.problems);
        doc = m.doc;
      }
      res.json(toResponse(doc, q.options.fields));
    };

    handlers['list' + resourceName] = async (req, res) => {
      const q = buildQuery(req.originalUrl.split('?')[1]);
      if (q.problems.length) return sendError(res, 400, 'TMF620-V5-400', 'Invalid query', q.problems.join('; '));
      // Documents still in the v4 format are converted first. One that cannot be
      // converted is left out (a GET of it answers 500), so it does not break the list
      const criteria = Object.assign({}, q.criteria, { _schema: compat.STORAGE_SCHEMA });
      let docs, total;
      try {
        const left = await migratePending(info);
        total = await store.count(info.collection, criteria);
        docs = await store.find(info.collection, criteria, { skip: q.options.skip, limit: q.options.limit, sort: q.options.sort, projection: q.options.projection });
        if (left) console.warn(`list ${info.key}: ${left} document(s) left out: they cannot be converted to the v5 storage format (see the migration log)`);
      } catch (err) { return failed(res, err, 'list ' + info.key); }
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
      if (!compat.isMigrated(stored)) {
        let m;
        try { m = await migrateOne(info, stored); } catch (err) { return failed(res, err, 'patch ' + info.key); }
        if (m.problems) return unmigrated(res, info, stored.id, m.problems);
        stored = m.doc;
      }

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
