'use strict';

// Spec section 8: stored v4 documents are migrated, not refused.

const test = require('node:test');
const assert = require('node:assert');
const { migrateDocument } = require('..');
const { parsePath } = require('../lib/migrate');
const { ctx, fixtures } = require('./helpers');

test('parsePath handles keys, indexes and @-keys', () => {
  assert.deepStrictEqual(parsePath('productSpecCharacteristic[0].productSpecCharRelationship[12].charSpecSeq'), ['productSpecCharacteristic', 0, 'productSpecCharRelationship', 12, 'charSpecSeq']);
  assert.deepStrictEqual(parsePath('targetProductSchema.@baseType'), ['targetProductSchema', '@baseType']);
  assert.deepStrictEqual(parsePath('constraint'), ['constraint']);
});

test('a clean v4 document migrates with nothing quarantined', () => {
  const r = migrateDocument('productSpecification', fixtures.productSpecification, ctx);
  assert.deepStrictEqual(r.problems, []);
  assert.deepStrictEqual(r.quarantined, []);
  assert.strictEqual(r.doc.productSpecCharacteristic[0].characteristicValueSpecification[0]['@type'], 'StringCharacteristicValueSpecification');
  assert.strictEqual(r.doc.href, '/productSpecification/ps-5g-mobile');
});

test('v4-only attributes are moved out with their values, at every depth', () => {
  const pop = Object.assign({}, fixtures.productOfferingPrice, { constraint: [{ id: 'c-1', name: 'Max 5 per account' }] });
  const r = migrateDocument('productOfferingPrice', pop, ctx);
  assert.deepStrictEqual(r.problems, []);
  assert.deepStrictEqual(r.quarantined, [{ path: 'constraint', value: [{ id: 'c-1', name: 'Max 5 per account' }] }]);
  assert.strictEqual(r.doc.constraint, undefined);
  assert.strictEqual(r.doc['@type'], 'ProductOfferingPrice');

  const ps = {
    id: 'ps-fw', name: 'Business Firewall',
    targetProductSchema: { '@type': 'Firewall', '@schemaLocation': 'https://example.test/Firewall.json', '@baseType': 'Product' },
    productSpecCharacteristic: [{ name: 'Rules', productSpecCharRelationship: [{ id: 'ps-2', name: 'x', charSpecSeq: 3 }] }]
  };
  const r2 = migrateDocument('productSpecification', ps, ctx);
  assert.deepStrictEqual(r2.problems, []);
  assert.deepStrictEqual(r2.quarantined.map(q => q.path).sort(), ['productSpecCharacteristic[0].productSpecCharRelationship[0].charSpecSeq', 'targetProductSchema.@baseType']);
  assert.deepStrictEqual(r2.quarantined.find(q => q.path.endsWith('charSpecSeq')).value, 3);
  assert.strictEqual(r2.doc.targetProductSchema['@baseType'], undefined);
});

test('a document with a problem a person must fix is not migrated', () => {
  const ps = { id: 'ps-bad', name: 'x', constraint: undefined, productSpecCharacteristic: [{ name: 'Data', valueType: 'integer', productSpecCharacteristicValue: [{ value: 'Unlimited' }] }] };
  const r = migrateDocument('productSpecification', ps, ctx);
  assert.strictEqual(r.doc, undefined);
  assert.deepStrictEqual(r.problems.map(p => p.code), ['TMF620-COMPAT-422-CHARVALUE-TYPE']);
});

test('the input document is not changed', () => {
  const pop = { id: 'p', name: 'x', constraint: [{ id: 'c' }] };
  migrateDocument('productOfferingPrice', pop, ctx);
  assert.deepStrictEqual(pop, { id: 'p', name: 'x', constraint: [{ id: 'c' }] });
});

// migrateStored: one stored document, as both APIs use it (v4 startup migration, v5 on first read)
test('migrateStored marks the document, keeps internal fields, defaults lifecycleStatus and builds the quarantine record', () => {
  const compat = require('../index');
  const stored = { _id: 'x1', _serviceType: 'st', id: 'pop-9', name: 'Old price', priceType: 'recurring', constraint: [{ id: 'c-1', name: 'UK only' }] };
  const r = compat.migrateStored('productOfferingPrice', stored, { componentName: 'r1-productcatalogmanagement' }, () => '2026-11-22T00:00:00.000Z');
  assert.deepStrictEqual(r.problems, []);
  assert.strictEqual(r.doc._schema, compat.STORAGE_SCHEMA);
  assert.strictEqual(r.doc._serviceType, 'st');
  assert.strictEqual(r.doc._id, undefined, 'the caller replaces by _id');
  assert.strictEqual(r.doc.lifecycleStatus, 'In design');
  assert.strictEqual(r.defaulted, true);
  assert.deepStrictEqual(r.quarantine, { resourceType: 'ProductOfferingPrice', id: 'pop-9', removed: [{ path: 'constraint', value: [{ id: 'c-1', name: 'UK only' }] }], migratedAt: '2026-11-22T00:00:00.000Z' });
  const kept = compat.migrateStored('category', { id: 'c', name: 'n', lifecycleStatus: 'Active' }, {});
  assert.strictEqual(kept.doc.lifecycleStatus, 'Active');
  assert.strictEqual(kept.defaulted, false);
  assert.strictEqual(kept.quarantine, undefined);
  const bad = compat.migrateStored('productSpecification', { id: 's', name: 'n', productSpecCharacteristic: [{ name: 'D', valueType: 'integer', productSpecCharacteristicValue: [{ value: 'Unlimited' }] }] }, {});
  assert.strictEqual(bad.doc, undefined);
  assert.match(compat.describeProblems(bad.problems), /Unlimited/);
});
