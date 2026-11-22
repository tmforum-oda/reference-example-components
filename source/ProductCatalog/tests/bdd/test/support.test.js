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
