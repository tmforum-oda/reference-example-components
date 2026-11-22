'use strict';

// T10: v5 CRUD on the collections shared with the v4 API, against the in-memory
// store, with response validation on (so every response is checked against the
// TMF620 v5.0.0 OAS).

const test = require('node:test');
const assert = require('node:assert');
const compat = require('tmf620-compat');
const { createApp } = require('../app');
const { memoryStore } = require('../utils/store');
const fixtures = require('tmf620-compat/test/fixtures');

const COMPONENT = 'r1-productcatalogmanagement';
const BASE = `/${COMPONENT}/tmf-api/productCatalogManagement/v5`;
const store = memoryStore();
let server;
let origin;

test.before(async () => {
  server = createApp({ componentName: COMPONENT, store, validateResponses: true }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

async function call(method, path, body, contentType = 'application/json') {
  const res = await fetch(origin + BASE + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = undefined; }
  return { status: res.status, json, text, headers: res.headers };
}

const now = new Date().toISOString();
const fibre = (name, extra) => Object.assign({
  '@type': 'ProductOffering', name, lifecycleStatus: 'Active', lastUpdate: now, isSellable: true
}, extra);

test('create, retrieve, patch and delete a productCatalog', async () => {
  const c = await call('POST', '/productCatalog', { '@type': 'ProductCatalog', name: 'Example Telco Consumer', lifecycleStatus: 'Active', lastUpdate: now });
  assert.strictEqual(c.status, 201, c.text);
  assert.ok(c.json.id);
  assert.strictEqual(c.json.href, `${BASE}/productCatalog/${c.json.id}`);
  assert.strictEqual(c.headers.get('location'), c.json.href);
  assert.strictEqual(c.json['@baseType'], 'Catalog', 'matrix G1');
  assert.strictEqual(c.json._schema, undefined);

  const stored = store.collections.Catalog.find(d => d.id === c.json.id);
  assert.strictEqual(stored.href, `/catalog/${c.json.id}`, 'href stored version-neutral');
  assert.strictEqual(stored._schema, 'TMF620-5.0.0');

  const g = await call('GET', `/productCatalog/${c.json.id}`);
  assert.strictEqual(g.status, 200, g.text);
  assert.strictEqual(g.json.name, 'Example Telco Consumer');

  const p = await call('PATCH', `/productCatalog/${c.json.id}`, { '@type': 'ProductCatalog', description: 'Mobile, broadband and TV' }, 'application/merge-patch+json');
  assert.strictEqual(p.status, 200, p.text);
  assert.strictEqual(p.json.description, 'Mobile, broadband and TV');
  assert.strictEqual(p.json.name, 'Example Telco Consumer');
  assert.ok(p.json.lastUpdate >= g.json.lastUpdate);

  assert.strictEqual((await call('DELETE', `/productCatalog/${c.json.id}`)).status, 204);
  assert.strictEqual((await call('GET', `/productCatalog/${c.json.id}`)).status, 404);
  assert.strictEqual((await call('DELETE', `/productCatalog/${c.json.id}`)).status, 404);
});

test('a second create with the same id is a 409', async () => {
  const body = { '@type': 'Category', id: 'catg-dup', name: 'Mobile', lifecycleStatus: 'Active', lastUpdate: now };
  assert.strictEqual((await call('POST', '/category', body)).status, 201);
  const again = await call('POST', '/category', body);
  assert.strictEqual(again.status, 409);
  assert.strictEqual(again.json['@type'], 'Error');
});

test('inbound hrefs to this catalogue are stored version-neutral and served as v5', async () => {
  const c = await call('POST', '/category', {
    '@type': 'Category', name: 'SIM-only Plans', lifecycleStatus: 'Active', lastUpdate: now,
    parent: { '@type': 'CategoryRef', id: 'catg-mobile', href: `https://localhost/${COMPONENT}/tmf-api/productCatalogManagement/v4/category/catg-mobile` }
  });
  assert.strictEqual(c.status, 201, c.text);
  assert.strictEqual(store.collections.Category.find(d => d.id === c.json.id).parent.href, '/category/catg-mobile');
  assert.strictEqual(c.json.parent.href, `${BASE}/category/catg-mobile`);
});

test('list: filters, operators, fields, paging, sort and the count headers', async () => {
  await call('POST', '/productOffering', fibre('Full Fibre 500', { version: '1', lifecycleStatus: 'Active' }));
  await call('POST', '/productOffering', fibre('Full Fibre 1000', { version: '2', lifecycleStatus: 'Active' }));
  await call('POST', '/productOffering', fibre('Full Fibre 150', { version: '1', lifecycleStatus: 'Retired', isSellable: false }));

  const active = await call('GET', '/productOffering?lifecycleStatus=Active&name.regex=^Full Fibre');
  assert.strictEqual(active.status, 200, active.text);
  assert.deepStrictEqual(active.json.map(o => o.name).sort(), ['Full Fibre 1000', 'Full Fibre 500']);
  assert.strictEqual(active.headers.get('x-total-count'), '2');
  assert.strictEqual(active.headers.get('x-result-count'), '2');

  const notSellable = await call('GET', '/productOffering?isSellable=false');
  assert.deepStrictEqual(notSellable.json.map(o => o.name), ['Full Fibre 150']);

  const anyOf = await call('GET', '/productOffering?name=Full Fibre 500,Full Fibre 150');
  assert.strictEqual(anyOf.json.length, 2);

  const notRetired = await call('GET', '/productOffering?name.regex=^Full&lifecycleStatus.ne=Retired');
  assert.strictEqual(notRetired.json.length, 2);

  const recent = await call('GET', `/productOffering?name.regex=^Full&lastUpdate.gte=${now.slice(0, 10)}`);
  assert.strictEqual(recent.json.length, 3, 'date-time ranges compare as ISO strings');
  const recentAlt = await call('GET', `/productOffering?name.regex=^Full&lastUpdate>=${now.slice(0, 10)}`);
  assert.strictEqual(recentAlt.json.length, 3);

  const page = await call('GET', '/productOffering?name.regex=^Full&sort=name&offset=1&limit=1&fields=name');
  assert.strictEqual(page.status, 200, page.text);
  assert.strictEqual(page.headers.get('x-total-count'), '3');
  assert.strictEqual(page.headers.get('x-result-count'), '1');
  assert.deepStrictEqual(Object.keys(page.json[0]).sort(), ['@type', 'href', 'id', 'name']);
  assert.strictEqual(page.json[0].name, 'Full Fibre 150', 'string sort: 1000 < 150 < 500');

  const bad = await call('GET', '/productOffering?_schema=x');
  assert.strictEqual(bad.status, 400);
});

test('PATCH with application/json-patch+json', async () => {
  const c = await call('POST', '/productOffering', fibre('TV Essentials', { category: [{ '@type': 'CategoryRef', id: 'catg-tv' }] }));
  const id = c.json.id;
  const p = await call('PATCH', `/productOffering/${id}`, [
    { op: 'replace', path: '/name', value: 'TV Essentials+' },
    { op: 'add', path: '/category/-', value: { '@type': 'CategoryRef', id: 'catg-entertainment' } }
  ], 'application/json-patch+json');
  assert.strictEqual(p.status, 200, p.text);
  assert.strictEqual(p.json.name, 'TV Essentials+');
  assert.deepStrictEqual(p.json.category.map(x => x.id), ['catg-tv', 'catg-entertainment']);

  const failedTest = await call('PATCH', `/productOffering/${id}`, [{ op: 'test', path: '/name', value: 'something else' }], 'application/json-patch+json');
  assert.strictEqual(failedTest.status, 409);
  const badPath = await call('PATCH', `/productOffering/${id}`, [{ op: 'remove', path: '/nope/x' }], 'application/json-patch+json');
  assert.strictEqual(badPath.status, 400);
  const query = await call('PATCH', `/productOffering/${id}`, [{ op: 'remove', path: '/category?id=catg-tv' }], 'application/json-patch-query+json');
  assert.strictEqual(query.status, 501);
});

test('PATCH refuses a characteristic value that does not fit its @type (matrix S5)', async () => {
  const c = await call('POST', '/productSpecification', {
    '@type': 'ProductSpecification', name: 'Full Fibre', lifecycleStatus: 'Active', lastUpdate: now,
    productSpecCharacteristic: [{ '@type': 'CharacteristicSpecification', name: 'Download speed', valueType: 'integer',
      characteristicValueSpecification: [{ '@type': 'IntegerCharacteristicValueSpecification', value: 500, unitOfMeasure: 'Mbps' }] }]
  });
  assert.strictEqual(c.status, 201, c.text);
  const p = await call('PATCH', `/productSpecification/${c.json.id}`, {
    '@type': 'ProductSpecification',
    productSpecCharacteristic: [{ '@type': 'CharacteristicSpecification', name: 'Download speed', valueType: 'integer',
      characteristicValueSpecification: [{ '@type': 'IntegerCharacteristicValueSpecification', value: 'gigabit' }] }]
  }, 'application/merge-patch+json');
  assert.strictEqual(p.status, 400, p.text);
  assert.strictEqual(p.json.code, 'TMF620-V5-400-CHARVALUE-TYPE');
});

test('a document an older v4 service wrote (no _schema) is refused with 500, not served', async () => {
  store.collections.Category = store.collections.Category || [];
  store.collections.Category.push({ _id: 'legacy', id: 'catg-legacy', name: 'Old', parentId: 'catg-mobile', href: `/${COMPONENT}/tmf-api/productCatalogManagement/v4/category/catg-legacy` });
  const g = await call('GET', '/category/catg-legacy');
  assert.strictEqual(g.status, 500);
  assert.strictEqual(g.json.code, 'TMF620-V5-500-UNMIGRATED');
  assert.match(g.json.message, /not been migrated/);
  const l = await call('GET', '/category?name=Old');
  assert.strictEqual(l.status, 500);
  assert.strictEqual((await call('PATCH', '/category/catg-legacy', { '@type': 'Category', name: 'x' }, 'application/merge-patch+json')).status, 500);
  store.collections.Category = store.collections.Category.filter(d => d.id !== 'catg-legacy');
});

// Cross-version: what the v4 API writes (tmf620-compat v4ToV5 on the telco fixtures)
// must be a valid v5 resource. Response validation is on, so an invalid document
// fails here with a 500.
test('documents written through v4 are valid TMF620 v5 responses', async () => {
  const ctx = { componentName: COMPONENT, v4BaseUrl: `/${COMPONENT}/tmf-api/productCatalogManagement/v4` };
  const v5Segment = { catalog: 'productCatalog' };
  const collection = { catalog: 'Catalog', category: 'Category', productOffering: 'ProductOffering', productOfferingPrice: 'ProductOfferingPrice', productSpecification: 'ProductSpecification' };
  for (const resource of Object.keys(collection)) {
    const r = compat.v4ToV5(resource, fixtures[resource], ctx);
    assert.deepStrictEqual(r.problems, [], resource);
    const doc = Object.assign(r.doc, { _schema: compat.STORAGE_SCHEMA, lastUpdate: now });
    if (doc.lifecycleStatus === undefined) doc.lifecycleStatus = 'In design';
    await store.insert(collection[resource], doc);
    const g = await call('GET', `/${v5Segment[resource] || resource}/${doc.id}`);
    assert.strictEqual(g.status, 200, `${resource}: ${g.text}`);
    assert.strictEqual(g.json.href, `${BASE}/${v5Segment[resource] || resource}/${doc.id}`);
  }
});

// The official OAS needs its discriminators applied (utils/spec.js withDiscriminatedOneOf):
// without that, every relatedParty is refused because a PartyRef also matches PartyRoleRef.
test('relatedParty with PartyRef, PartyRoleRef or an extension subtype is accepted; a mismatched @type is not', async () => {
  const body = (partyOrPartyRole) => ({ '@type': 'ProductCatalog', name: 'Example Telco Business', lifecycleStatus: 'Active', lastUpdate: now,
    relatedParty: [{ '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'owner', partyOrPartyRole }] });
  for (const p of [
    { '@type': 'PartyRef', id: 'org-001', name: 'Example Telco', '@referredType': 'Organization' },
    { '@type': 'PartyRoleRef', id: 'pr-9', partyId: 'ind-1', partyName: 'Sam Jones', '@referredType': 'PartyRole' },
    { '@type': 'SupplierRef', '@schemaLocation': 'https://example.test/SupplierRef.json', id: 'sup-1' }
  ]) {
    const r = await call('POST', '/productCatalog', body(p));
    assert.strictEqual(r.status, 201, `${p['@type']}: ${r.text}`);
    assert.deepStrictEqual(r.json.relatedParty[0].partyOrPartyRole, p);
  }
  const missingId = await call('POST', '/productCatalog', body({ '@type': 'PartyRef', name: 'no id' }));
  assert.strictEqual(missingId.status, 400);
});
