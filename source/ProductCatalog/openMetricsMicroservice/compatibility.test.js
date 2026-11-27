'use strict';

// Run with: npm test (needs Node 18+ for node:test; the image itself runs on Node 10)
const test = require('node:test');
const assert = require('node:assert');
const client = require('prom-client');
const compat = require('./compatibility');

function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = function (c) { res.statusCode = c; return res; };
  res.send = function (b) { res.body = b; return res; };
  res.end = function () { return res; };
  return res;
}

function setup() {
  const register = new client.Registry();
  const counter = compat.createCompatibilityCounter(client, 'r1_productcatalogmanagement', register);
  return { register, handler: compat.compatibilityHandler(counter) };
}

async function valueOf(register, labels) {
  const metric = await register.getSingleMetric('r1_productcatalogmanagement_tmf620_compatibility_total').get();
  const match = metric.values.find(v => Object.keys(labels).every(k => v.labels[k] === labels[k]));
  return match ? match.value : 0;
}

test('kind is derived from the code', () => {
  assert.strictEqual(compat.kindOf('TMF620-COMPAT-422-V4ONLY-ATTR'), 'error');
  assert.strictEqual(compat.kindOf('W-V5ONLY-ATTR'), 'warning');
  assert.strictEqual(compat.kindOf('nonsense'), undefined);
});

test('a single report increments the counter with bounded labels', async () => {
  const { register, handler } = setup();
  const res = fakeRes();
  handler({ body: { code: 'W-V5ONLY-ATTR', kind: 'warning', resource: 'productOffering', operation: 'read' } }, res);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(await valueOf(register, { code: 'W-V5ONLY-ATTR', resource: 'productOffering', operation: 'read', kind: 'warning' }), 1);
});

test('a batch with counts is applied in full', async () => {
  const { register, handler } = setup();
  const res = fakeRes();
  handler({ body: [
    { code: 'W-PARTYROLE', resource: 'catalog', operation: 'list', count: 7 },
    { code: 'TMF620-COMPAT-409-UNMATCHED', resource: 'productOffering', operation: 'patch' }
  ] }, res);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(await valueOf(register, { code: 'W-PARTYROLE' }), 7);
  assert.strictEqual(await valueOf(register, { code: 'TMF620-COMPAT-409-UNMATCHED', kind: 'error' }), 1);
});

test('a batch with one bad report changes nothing', async () => {
  const { register, handler } = setup();
  const res = fakeRes();
  handler({ body: [
    { code: 'W-PARTYROLE', resource: 'catalog', operation: 'list' },
    { code: 'W-PARTYROLE', resource: 'productOffering/6b1d', operation: 'read' }
  ] }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /report 1: unknown resource/);
  assert.strictEqual(await valueOf(register, { code: 'W-PARTYROLE' }), 0);
});

test('invalid label values and counts are rejected with a reason', () => {
  const cases = [
    [{ code: 'X', resource: 'catalog', operation: 'read' }, /unknown code/],
    [{ code: 'W-V5ONLY-ATTR', kind: 'error', resource: 'catalog', operation: 'read' }, /is a warning, not a error/],
    [{ code: 'W-V5ONLY-ATTR', resource: 'catalog', operation: 'delete' }, /unknown operation/],
    [{ code: 'W-V5ONLY-ATTR', resource: 'catalog', operation: 'read', count: 0 }, /count must be/],
    [{ code: 'W-V5ONLY-ATTR', resource: 'catalog', operation: 'read', count: 1.5 }, /count must be/],
    ['text', /must be an object/]
  ];
  for (const [report, expected] of cases) {
    assert.match(compat.validateReport(report).error, expected);
  }
});

test('an empty batch is rejected', () => {
  const { handler } = setup();
  const res = fakeRes();
  handler({ body: [] }, res);
  assert.strictEqual(res.statusCode, 400);
});
