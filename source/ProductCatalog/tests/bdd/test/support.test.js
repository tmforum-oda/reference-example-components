'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadConfig, resourceUrl } = require('../support/config');
const { cleanupPlan } = require('../support/cleanup');

test('default base URLs point at the local Canvas gateway for release r1', () => {
  const c = loadConfig({});
  assert.strictEqual(c.baseUrls.v4, 'https://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4');
  assert.strictEqual(c.baseUrls.v5, 'https://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v5');
  assert.strictEqual(c.tlsInsecure, true);
});

test('explicit base URLs win, and TLS checks stay on for remote hosts', () => {
  const c = loadConfig({ TMF620_V4_BASE_URL: 'https://staging.example.com/a/v4/', TMF620_V5_BASE_URL: 'https://staging.example.com/a/v5' });
  assert.strictEqual(c.baseUrls.v4, 'https://staging.example.com/a/v4');
  assert.strictEqual(c.tlsInsecure, false);
  assert.strictEqual(loadConfig({ TMF620_TLS_INSECURE: 'false' }).tlsInsecure, false);
});

test('the catalog path differs by version (matrix G1)', () => {
  const c = loadConfig({});
  assert.match(resourceUrl(c, 'v4', 'catalog', 'abc'), /\/v4\/catalog\/abc$/);
  assert.match(resourceUrl(c, 'v5', 'catalog', 'abc'), /\/v5\/productCatalog\/abc$/);
  assert.match(resourceUrl(c, 'v5', 'productOfferingPrice'), /\/v5\/productOfferingPrice$/);
});

test('unknown versions and resources fail with a clear message', () => {
  const c = loadConfig({});
  assert.throws(() => resourceUrl(c, 'v3', 'catalog'), /Unknown TMF620 API version 'v3'/);
  assert.throws(() => resourceUrl(c, 'v4', 'productOrder'), /Unknown TMF620 resource 'productOrder'/);
});

test('cleanup deletes dependants first and newest first within a type', () => {
  const created = [
    { resource: 'catalog', id: 'cat' },
    { resource: 'category', id: 'mobile' },
    { resource: 'category', id: 'sim-only' },   // child of mobile, created later
    { resource: 'productSpecification', id: 'spec' },
    { resource: 'productOfferingPrice', id: 'price' },
    { resource: 'productOffering', id: 'offer' }
  ];
  assert.deepStrictEqual(cleanupPlan(created).map(r => r.id), ['offer', 'price', 'spec', 'sim-only', 'mobile', 'cat']);
});

const { missingContent, resolveText, resolveJson, at } = require('../support/telco');
const { parseCompatibilityCounter, total } = require('../support/metrics');

test('missingContent: what was sent must come back; extra attributes are fine', () => {
  const sent = { name: 'a', price: { unit: 'GBP', value: 30 }, list: [{ id: '1' }], lastUpdate: 'x' };
  assert.deepStrictEqual(missingContent(sent, { name: 'a', id: 'i', price: { unit: 'GBP', value: 30, '@type': 'Money' }, list: [{ id: '1', href: 'h' }] }), []);
  assert.deepStrictEqual(missingContent(sent, { name: 'a', price: { unit: 'GBP', value: '30' }, list: [] }), [
    'price.value: sent 30, got "30"',
    'list: sent 1 items, got 0'
  ]);
});

test('aliases resolve in feature text and JSON; an unknown alias names the known ones', () => {
  const world = { named: { monthly: { id: 'pop-1', name: 'Monthly [run]' } } };
  assert.strictEqual(resolveText(world, '{{id:monthly}}-activation'), 'pop-1-activation');
  assert.deepStrictEqual(resolveJson(world, '{ "id": "{{id:monthly}}", "name": "{{name: monthly}}" }'), { id: 'pop-1', name: 'Monthly [run]' });
  assert.throws(() => resolveText(world, '{{id:yearly}}'), /'yearly'.*have: monthly/);
  assert.strictEqual(at({ a: [{ b: 1 }] }, 'a.0.b'), 1);
  assert.strictEqual(at([{ b: 2 }], '0.b'), 2);
});

test('the compatibility counter is read from Prometheus text and summed by label', () => {
  const text = [
    '# HELP r1_productcatalogmanagement_tmf620_compatibility_total TMF620 v4/v5 compatibility warnings and errors',
    '# TYPE r1_productcatalogmanagement_tmf620_compatibility_total counter',
    'r1_productcatalogmanagement_tmf620_compatibility_total{code="W-V5ONLY-ATTR",kind="warning",resource="productOffering",operation="read"} 3',
    'r1_productcatalogmanagement_tmf620_compatibility_total{code="W-V5ONLY-ATTR",kind="warning",resource="category",operation="read"} 2',
    'r1_productcatalogmanagement_tmf620_compatibility_total{code="TMF620-COMPAT-422-V4ONLY-ATTR",kind="error",resource="productOfferingPrice",operation="create"} 1',
    'r1_productcatalogmanagement_api_requests_total{code="200"} 9'
  ].join('\n');
  const series = parseCompatibilityCounter(text);
  assert.strictEqual(series.length, 3);
  assert.strictEqual(total(series, { code: 'W-V5ONLY-ATTR' }), 5);
  assert.strictEqual(total(series, { code: 'W-V5ONLY-ATTR', resource: 'category', operation: 'read' }), 2);
  assert.strictEqual(total(series, { code: 'W-PARTYROLE' }), 0);
});
