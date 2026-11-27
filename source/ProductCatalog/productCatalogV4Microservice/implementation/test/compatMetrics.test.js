'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createReporter } = require('../utils/compatMetrics');

test('counts are batched per code, resource and operation', async () => {
  const sent = [];
  const r = createReporter({ url: 'http://metrics/compatibility', flushMs: 60000, post: (u, b) => { sent.push(b); return Promise.resolve(); } });
  r.recordAll([{ code: 'W-V5ONLY-ATTR' }, { code: 'W-V5ONLY-ATTR' }, { code: 'W-PARTYROLE' }], 'catalog', 'list');
  r.record('W-V5ONLY-ATTR', 'catalog', 'list');
  r.record('W-V5ONLY-ATTR', 'catalog', 'read');
  assert.strictEqual(sent.length, 0, 'nothing is sent before the flush');
  await r.flush();
  assert.strictEqual(sent.length, 1, 'one call for all counts');
  assert.deepStrictEqual(sent[0].sort((a, b) => (a.code + a.operation).localeCompare(b.code + b.operation)), [
    { code: 'W-PARTYROLE', resource: 'catalog', operation: 'list', count: 1 },
    { code: 'W-V5ONLY-ATTR', resource: 'catalog', operation: 'list', count: 3 },
    { code: 'W-V5ONLY-ATTR', resource: 'catalog', operation: 'read', count: 1 }
  ]);
  assert.strictEqual(r.pendingCount(), 0);
});

test('a metrics outage never throws, and is logged once until it recovers', async () => {
  const logs = [];
  let up = false;
  const r = createReporter({ url: 'http://metrics/compatibility', flushMs: 60000, log: m => logs.push(m),
    post: () => up ? Promise.resolve() : Promise.reject(new Error('ECONNREFUSED')) });
  for (let i = 0; i < 3; i++) { r.record('W-PARTYROLE', 'catalog', 'read'); await r.flush(); }
  assert.strictEqual(logs.length, 1);
  assert.match(logs[0], /could not report.*ECONNREFUSED/);
  up = true;
  r.record('W-PARTYROLE', 'catalog', 'read'); await r.flush();
  assert.strictEqual(logs.length, 2);
  assert.match(logs[1], /works again/);
});

test('a post that throws synchronously is contained too', async () => {
  const r = createReporter({ url: 'http://m', flushMs: 60000, log: () => {}, post: () => { throw new Error('boom'); } });
  r.record('W-PARTYROLE', 'catalog', 'read');
  await r.flush();
});

test('without METRICS_COMPATIBILITY_URL nothing is recorded or sent', async () => {
  let calls = 0;
  const r = createReporter({ url: undefined, post: () => { calls++; return Promise.resolve(); } });
  r.record('W-PARTYROLE', 'catalog', 'read');
  assert.strictEqual(r.pendingCount(), 0);
  await r.flush();
  assert.strictEqual(calls, 0);
});

test('one flush per batch window', async () => {
  let calls = 0;
  const r = createReporter({ url: 'http://m', flushMs: 10, post: () => { calls++; return Promise.resolve(); } });
  r.record('W-PARTYROLE', 'catalog', 'read');
  r.record('W-PARTYROLE', 'category', 'read');
  await new Promise(res => setTimeout(res, 50));
  assert.strictEqual(calls, 1);
});
