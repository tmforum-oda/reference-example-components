'use strict';

// T7: startup migration (spec section 8), against a minimal fake of the MongoDB
// 3.x driver API the service uses.

const test = require('node:test');
const assert = require('node:assert');
const { migrate, migrateOnStartup } = require('../utils/migration');

function matches(doc, filter) {
  return Object.keys(filter).every(k => {
    const cond = filter[k];
    if (cond && typeof cond === 'object' && '$ne' in cond) return doc[k] !== cond.$ne;
    return doc[k] === cond;
  });
}

function fakeDb(seed) {
  const data = JSON.parse(JSON.stringify(seed));
  const coll = name => (data[name] = data[name] || []);
  return {
    data,
    collection(name) {
      return {
        find: filter => ({ toArray: async () => coll(name).filter(d => matches(d, filter)).map(d => JSON.parse(JSON.stringify(d))) }),
        async replaceOne(filter, doc) {
          const i = coll(name).findIndex(d => matches(d, filter));
          if (i < 0) return { matchedCount: 0 };
          coll(name)[i] = Object.assign({ _id: coll(name)[i]._id }, doc);
          return { matchedCount: 1 };
        },
        async updateOne(filter, update, opts) {
          const i = coll(name).findIndex(d => matches(d, filter));
          if (i >= 0) Object.assign(coll(name)[i], update.$set);
          else if (opts && opts.upsert) coll(name).push(Object.assign({}, filter, update.$set));
          return {};
        }
      };
    }
  };
}

const V4 = '/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4';
const seed = {
  Catalog: [
    { _id: 'm1', id: 'cat-1', name: 'Example Telco Consumer Catalogue', '@type': 'Catalog', '@baseType': 'Catalog', href: `${V4}/catalog/cat-1`,
      relatedParty: [{ id: 'org-001', name: 'Example Telco', role: 'owner', '@referredType': 'Organization' }],
      category: [{ id: 'catg-1', href: `${V4}/category/catg-1` }] },
    { _id: 'm2', id: 'cat-2', name: 'Already migrated', '@type': 'ProductCatalog', href: '/catalog/cat-2', _schema: 'TMF620-5.0.0' }
  ],
  ProductOfferingPrice: [
    { _id: 'm3', id: 'pop-1', name: '5G Unlimited monthly', priceType: 'recurring', href: `${V4}/productOfferingPrice/pop-1`,
      constraint: [{ id: 'c-1', name: 'Max 5 per account' }], _serviceType: 'st' }
  ],
  ProductSpecification: [
    { _id: 'm4', id: 'ps-bad', name: 'Broken', productSpecCharacteristic: [{ name: 'Data', valueType: 'integer', productSpecCharacteristicValue: [{ value: 'Unlimited' }] }] },
    { _id: 'm5', name: 'No id' }
  ]
};

function recorder() {
  const counts = [];
  return { counts, record: (code, resource, operation, count) => counts.push({ code, resource, operation, count }), recordAll: (items, resource, operation) => items.forEach(i => counts.push({ code: i.code, resource, operation, count: 1 })) };
}

test('converts, quarantines, and leaves what it cannot convert', async () => {
  const db = fakeDb(seed);
  const logs = [];
  const reporter = recorder();
  const { total, summary } = await migrate(db, { log: m => logs.push(m), reporter, now: () => '2026-11-22T00:00:00.000Z' });

  assert.deepStrictEqual(total, { converted: 2, quarantined: 1, failed: 1, skipped: 1 });
  assert.deepStrictEqual(summary.catalog, { converted: 1, quarantined: 0, failed: 0, skipped: 0 });

  const cat = db.data.Catalog.find(d => d.id === 'cat-1');
  assert.strictEqual(cat._id, 'm1', 'same Mongo document');
  assert.strictEqual(cat._schema, 'TMF620-5.0.0');
  assert.strictEqual(cat['@type'], 'ProductCatalog');
  assert.strictEqual(cat.href, '/catalog/cat-1');
  assert.strictEqual(cat.category[0].href, '/category/catg-1');
  assert.strictEqual(cat.relatedParty[0].partyOrPartyRole.id, 'org-001');

  const pop = db.data.ProductOfferingPrice[0];
  assert.strictEqual(pop.constraint, undefined);
  assert.strictEqual(pop._serviceType, 'st');
  assert.deepStrictEqual(db.data.MigrationQuarantine, [{
    resourceType: 'ProductOfferingPrice', id: 'pop-1', migratedAt: '2026-11-22T00:00:00.000Z',
    removed: [{ path: 'constraint', value: [{ id: 'c-1', name: 'Max 5 per account' }] }]
  }]);

  const bad = db.data.ProductSpecification.find(d => d.id === 'ps-bad');
  assert.strictEqual(bad._schema, undefined, 'left unchanged');
  assert.ok(logs.some(l => /ps-bad cannot be converted.*Unlimited/.test(l)), logs.join('\n'));
  assert.ok(logs.some(l => /pop-1: moved constraint to MigrationQuarantine/.test(l)));
  assert.ok(logs.some(l => /^TMF620 migration done: 2 converted/.test(l)));

  assert.deepStrictEqual(reporter.counts, [
    { code: 'W-V4ONLY-QUARANTINED', resource: 'productOfferingPrice', operation: 'migration', count: 1 },
    { code: 'TMF620-COMPAT-422-CHARVALUE-TYPE', resource: 'productSpecification', operation: 'migration', count: 1 }
  ]);
});

test('is idempotent: a second run changes nothing', async () => {
  const db = fakeDb(seed);
  const quiet = { log: () => {}, reporter: recorder() };
  await migrate(db, quiet);
  const after = JSON.stringify(db.data);
  const second = await migrate(db, quiet);
  assert.strictEqual(second.total.converted, 0);
  assert.strictEqual(JSON.stringify(db.data), after);
});

test('waits for MongoDB and never throws', async () => {
  let calls = 0;
  const logs = [];
  const db = fakeDb({});
  const connect = () => (++calls < 3 ? Promise.reject(new Error('ECONNREFUSED')) : Promise.resolve(db));
  const r = await migrateOnStartup(connect, { delayMs: 1, log: m => logs.push(m), reporter: recorder() });
  assert.strictEqual(calls, 3);
  assert.strictEqual(r.total.converted, 0);
  const never = await migrateOnStartup(() => Promise.reject(new Error('down')), { attempts: 2, delayMs: 1, log: () => {} });
  assert.strictEqual(never, undefined);
});
