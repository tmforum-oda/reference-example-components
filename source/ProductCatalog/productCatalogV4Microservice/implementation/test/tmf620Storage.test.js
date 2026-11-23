'use strict';

const test = require('node:test');
const assert = require('node:assert');
const storage = require('../utils/tmf620Storage');

function quietly(fn) {
  const orig = console.warn; console.warn = () => {};
  try { return fn(); } finally { console.warn = orig; }
}

test('query strings keep operators on the key', () => {
  const q = storage.parseQueryString('lastUpdate>=2026-01-01&name=5G%20Unlimited&fields=name,parentId');
  assert.deepStrictEqual(q, { 'lastUpdate>': '2026-01-01', name: '5G Unlimited', fields: 'name,parentId' });
  assert.strictEqual(storage.stringifyQuery({ 'lastUpdate>': '2026-01-01', '@type': 'Catalog', name: 'a&b' }), 'lastUpdate>=2026-01-01&@type=Catalog&name=a%26b');
});

test('mapQuery maps filters and fields, and asks for what the v4 view needs', () => {
  const m = storage.mapQuery('category', storage.parseQueryString('parentId=catg-mobile&fields=name,parentId'));
  assert.deepStrictEqual(m.problems, []);
  assert.strictEqual(m.query['parent.id'], 'catg-mobile');
  assert.deepStrictEqual(m.query.fields.split(',').sort(), ['@type', '_schema', 'name', 'parent']);
  assert.deepStrictEqual(m.v4Fields, ['name', 'parentId']);
});

test('projectView returns only the requested v4 fields plus id and href', () => {
  assert.deepStrictEqual(storage.projectView({ id: '1', href: 'h', name: 'n', '@type': 'Category', parentId: 'p' }, ['name']), { id: '1', href: 'h', name: 'n' });
});

test('toStorage marks the document; toV4View leaves unmigrated documents alone', () => {
  const s = storage.toStorage('category', { id: 'c1', name: 'Mobile', parentId: 'root' });
  assert.strictEqual(s.doc._schema, 'TMF620-5.0.0');
  assert.strictEqual(s.doc.parent.id, 'root');
  const v = storage.toV4View('category', Object.assign({ _id: 'x', _serviceType: 'st' }, s.doc));
  assert.strictEqual(v.doc.parentId, 'root');
  assert.strictEqual(v.doc._serviceType, 'st');
  assert.strictEqual(v.doc._schema, undefined);
  const legacy = { id: 'c2', name: 'Old', parentId: 'root', href: '/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4/category/c2' };
  assert.deepStrictEqual(storage.toV4View('category', legacy).doc, legacy);
});

test('patchStorage: v4-only attributes are refused; unmigrated documents are converted', () => {
  const pop = storage.toStorage('productOfferingPrice', { id: 'p1', name: 'Monthly' }).doc;
  assert.strictEqual(storage.patchStorage('productOfferingPrice', pop, { constraint: [{ id: 'x' }] }).problems[0].code, 'TMF620-COMPAT-422-V4ONLY-ATTR');
  const legacy = { _id: 'mongo', id: 'c2', name: 'Old', parentId: 'root' };
  const r = storage.patchStorage('category', legacy, { description: 'new' });
  assert.deepStrictEqual(r.problems, []);
  assert.strictEqual(r.doc._schema, 'TMF620-5.0.0');
  assert.strictEqual(r.doc._id, undefined, 'never rewrites _id');
  assert.strictEqual(r.doc.parent.id, 'root');
  assert.strictEqual(r.doc.description, 'new');
});

test('sendProblems answers with one TMF Error and the right status', () => {
  const headers = {}; let body;
  const res = { setHeader: (k, v) => { headers[k] = v; }, end: b => { body = JSON.parse(b); } };
  quietly(() => storage.sendProblems(res, [{ code: 'TMF620-COMPAT-400-V4ONLY-FILTER', path: 'constraint.id', detail: 'd' }], 'productOfferingPrice', undefined, 'filter'));
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(body.code, 'TMF620-COMPAT-400-V4ONLY-FILTER');
  assert.strictEqual(headers['Content-Type'], 'application/json');
});

test('warningCollector sets one header per resource and code', () => {
  const headers = {};
  const res = { setHeader: (k, v) => { headers[k] = v; } };
  const w = storage.warningCollector('catalog', 'list');
  w.add([{ code: 'W-PARTYROLE', path: 'relatedParty[0].partyOrPartyRole.partyId' }], 'c1');
  w.add([{ code: 'W-V5ONLY-ATTR', path: 'policy' }], 'c2');
  quietly(() => w.apply(res));
  assert.strictEqual(headers['X-TMF-Compatibility-Warning'].length, 2);
  assert.match(headers['X-TMF-Compatibility-Warning'][0], /^W-PARTYROLE; resource=catalog\/c1;/);
});
