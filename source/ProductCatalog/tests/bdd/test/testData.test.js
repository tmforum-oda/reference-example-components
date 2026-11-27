'use strict';

// T14: the telco catalogue renders as a valid create body in both versions.

const test = require('node:test');
const assert = require('node:assert');
const data = require('../testData');
const { validate, SCHEMA_NAMES } = require('../clients/schemas');
const { Tmf620V4Client } = require('../clients/Tmf620V4Client');
const { Tmf620V5Client } = require('../clients/Tmf620V5Client');
const { loadConfig } = require('../support/config');

const deps = { config: loadConfig({}), http: {}, runId: 'bdd-test' };
const clients = { v4: new Tmf620V4Client(deps), v5: new Tmf620V5Client(deps) };

// Pretend every entry was created already, with a predictable id
const ctx = { ref: (kind, key) => ({ id: `${kind}-${key}`, name: data.entry(kind, key).name }), name: n => `${n} [bdd-test]` };

test('the catalogue has what spec 10.2 lists', () => {
  assert.deepStrictEqual(data.keys('catalog').length, 2);
  assert.deepStrictEqual(data.keys('productSpecification').length, 5);
  assert.deepStrictEqual(data.keys('productOffering').length, 7);
  const kinds = new Set(data.keys('productOfferingPrice').map(k => data.entry('productOfferingPrice', k).kind));
  assert.deepStrictEqual([...kinds].sort(), ['discount', 'oneTime', 'recurring', 'usage']);
  assert.ok(data.entry('productOffering', 'home-bundle').isBundle);
});

test('no name has a comma: the list steps filter by name, and a comma there means "any of"', () => {
  const withComma = data.everything().map(([k, x]) => data.entry(k, x).name).filter(n => n.indexOf(',') >= 0);
  assert.deepStrictEqual(withComma, []);
});

for (const version of ['v4', 'v5']) {
  test(`${version}: every entry is a valid ${version} create body`, () => {
    const schemaOf = kind => version === 'v4' ? `${SCHEMA_NAMES.v4[kind]}_Create` : `${SCHEMA_NAMES.v5[kind]}_FVO`;
    const problems = [];
    for (const [kind, key] of data.everything()) {
      const body = clients[version].build(kind, data.payload(version, kind, key, ctx));
      const errors = validate(version, schemaOf(kind), body);
      if (errors.length) problems.push(`${kind}/${key}: ${errors.join('; ')}`);
    }
    assert.deepStrictEqual(problems, []);
  });
}

test('references are resolved through ctx, and left out when not created', () => {
  const full = data.payload('v4', 'productOffering', 'home-bundle', ctx);
  assert.deepStrictEqual(full.bundledProductOffering.map(b => b.id), ['productOffering-ff1000', 'productOffering-tv-essentials']);
  assert.strictEqual(full.productSpecification.id, 'productSpecification-home-bundle');
  const bare = data.payload('v5', 'productOffering', 'home-bundle', { name: n => n });
  assert.strictEqual(bare.bundledProductOffering, undefined);
  assert.strictEqual(bare.productSpecification, undefined);
  assert.strictEqual(data.payload('v4', 'category', 'sim-only', ctx).parentId, 'category-mobile');
  assert.deepStrictEqual(data.payload('v5', 'category', 'sim-only', ctx).parent, { '@type': 'CategoryRef', id: 'category-mobile' });
});

test('the two versions differ where TMF620 does', () => {
  const v4 = data.payload('v4', 'productSpecification', '5g-mobile', ctx);
  const v5 = data.payload('v5', 'productSpecification', '5g-mobile', ctx);
  const tether4 = v4.productSpecCharacteristic.find(c => c.name === 'Tethering allowance');
  const tether5 = v5.productSpecCharacteristic.find(c => c.name === 'Tethering allowance');
  assert.deepStrictEqual(tether4.productSpecCharacteristicValue, [{ valueFrom: '0', valueTo: '100', unitOfMeasure: 'GB' }]);
  assert.deepStrictEqual(tether5.characteristicValueSpecification, [{ '@type': 'IntegerCharacteristicValueSpecification', valueFrom: 0, valueTo: 100, unitOfMeasure: 'GB' }]);
  assert.deepStrictEqual(v4.relatedParty, [{ id: 'org-example-telco', name: 'Example Telco', role: 'owner', '@referredType': 'Organization' }]);
  assert.strictEqual(v5.relatedParty[0].partyOrPartyRole['@type'], 'PartyRef');
  assert.strictEqual(v5.productSpecCharacteristic.find(c => c.name === 'EU roaming').characteristicValueSpecification[0]['@type'], 'BooleanCharacteristicValueSpecification');
});

test('creation order puts dependencies first', () => {
  const order = data.creationOrder([['productOffering', 'home-bundle']]).map(([k, x]) => `${k}/${x}`);
  assert.strictEqual(order[order.length - 1], 'productOffering/home-bundle');
  for (const dep of ['productOffering/ff1000', 'productOffering/tv-essentials', 'productSpecification/full-fibre', 'productOfferingPrice/ff1000-discount', 'category/bundles']) {
    assert.ok(order.indexOf(dep) >= 0 && order.indexOf(dep) < order.length - 1, dep);
  }
  assert.ok(order.indexOf('productOfferingPrice/ff1000-discount') < order.indexOf('productOfferingPrice/ff1000-monthly'));
  assert.ok(order.indexOf('productSpecification/full-fibre') < order.indexOf('productSpecification/home-bundle'));
  assert.deepStrictEqual(data.creationOrder([['category', 'sim-only']], { withoutRoots: true }), [['category', 'mobile']]);
});
