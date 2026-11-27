'use strict';

// T13: the two test clients' builders and response validation (no API needed).

const test = require('node:test');
const assert = require('node:assert');
const { validateResource } = require('../clients/schemas');
const { Tmf620V4Client } = require('../clients/Tmf620V4Client');
const { Tmf620V5Client } = require('../clients/Tmf620V5Client');
const { Tmf620Response } = require('../clients/Tmf620Client');
const { loadConfig } = require('../support/config');

const deps = { config: loadConfig({}), http: {}, runId: 'bdd-test' };

test('each client validates against its own version: shapes from the other version fail', () => {
  const v5Party = { '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'owner', partyOrPartyRole: { '@type': 'PartyRef', id: 'org-001' } };
  const v4Party = { id: 'org-001', role: 'owner', '@referredType': 'Organization' };

  assert.deepStrictEqual(validateResource('v4', 'catalog', { id: 'c', name: 'x', relatedParty: [v4Party] }), []);
  assert.ok(validateResource('v4', 'catalog', { id: 'c', name: 'x', relatedParty: [v5Party] }).length > 0, 'v5 relatedParty fails v4');

  assert.deepStrictEqual(validateResource('v5', 'catalog', { '@type': 'ProductCatalog', id: 'c', name: 'x', relatedParty: [v5Party] }), []);
  assert.ok(validateResource('v5', 'catalog', { '@type': 'ProductCatalog', id: 'c', relatedParty: [v4Party] }).length > 0, 'v4 relatedParty fails v5');

  assert.match(validateResource('v4', 'productSpecification', { id: 'p', productSpecCharacteristic: [{ name: 'a', productSpecCharacteristicValue: [{ valueFrom: 1 }] }] })[0], /valueFrom must be string/);
  assert.match(validateResource('v5', 'productSpecification', { '@type': 'ProductSpecification', id: 'p',
    productSpecCharacteristic: [{ '@type': 'CharacteristicSpecification', name: 'a', characteristicValueSpecification: [{ '@type': 'IntegerCharacteristicValueSpecification', valueFrom: '1' }] }] })[0], /valueFrom must be integer/);
  assert.deepStrictEqual(validateResource('v5', 'catalog', { id: 'c' }), ["(root) must have required property '@type'"]);
});

test('v5: PartyRef and PartyRoleRef are told apart by @type (discriminator applied)', () => {
  const rp = p => ({ '@type': 'ProductCatalog', id: 'c', relatedParty: [{ '@type': 'RelatedPartyRefOrPartyRoleRef', partyOrPartyRole: p }] });
  assert.deepStrictEqual(validateResource('v5', 'catalog', rp({ '@type': 'PartyRoleRef', id: 'pr', partyId: 'i' })), []);
  assert.ok(validateResource('v5', 'catalog', rp({ '@type': 'PartyRef' })).length > 0, 'id is required');
});

test('v4: the relative @schemaLocation and href the v4 service returns are accepted', () => {
  assert.deepStrictEqual(validateResource('v4', 'catalog', { id: 'c', href: '/r1/tmf-api/productCatalogManagement/v4/catalog/c', '@schemaLocation': '/docs/#/' }), []);
});

test('lists are validated item by item', () => {
  const errors = validateResource('v5', 'category', [{ '@type': 'Category', id: 'a' }, { id: 'b' }]);
  assert.deepStrictEqual(errors, ["[1](root) must have required property '@type'"]);
});

test('builders: v4 sends what it is given; v5 adds @type and what the FVO requires', () => {
  const v4 = new Tmf620V4Client(deps);
  const v5 = new Tmf620V5Client(deps);
  assert.deepStrictEqual(v4.build('productOfferingPrice', { name: 'Monthly' }), { name: 'Monthly' });
  const pop = v5.build('productOfferingPrice', { name: 'Monthly' });
  assert.strictEqual(pop['@type'], 'ProductOfferingPrice');
  assert.strictEqual(pop.priceType, 'recurring');
  assert.strictEqual(pop.lifecycleStatus, 'In design');
  assert.ok(pop.lastUpdate);
  assert.deepStrictEqual(v5.build('catalog', { name: 'C' }), { '@type': 'ProductCatalog', name: 'C' });
  assert.strictEqual(v5.build('productOffering', { lifecycleStatus: 'Active', name: 'x' }).lifecycleStatus, 'Active', 'given values win');
});

test('v5 patches are merge patches with @type; paths differ for the catalog', () => {
  const v4 = new Tmf620V4Client(deps);
  const v5 = new Tmf620V5Client(deps);
  assert.strictEqual(v5.patchContentType(), 'application/merge-patch+json');
  assert.deepStrictEqual(v5.shapePatch('catalog', { description: 'd' }), { '@type': 'ProductCatalog', description: 'd' });
  assert.deepStrictEqual(v5.shapePatch('catalog', [{ op: 'remove', path: '/x' }]), [{ op: 'remove', path: '/x' }], 'JSON Patch is left alone');
  assert.strictEqual(v4.patchContentType(), 'application/json');
  assert.match(v4.url('catalog', 'c1'), /\/v4\/catalog\/c1$/);
  assert.match(v5.url('catalog', 'c1'), /\/v5\/productCatalog\/c1$/);
  assert.strictEqual(v5.testName('Home Bundle'), 'Home Bundle [bdd-test]');
});

test('compatibility warning headers are split into one value per warning', () => {
  const r = new Tmf620Response('v4', 'GET', 'u', { status: 200, headers: { 'x-tmf-compatibility-warning': 'W-PARTYROLE; resource=catalog/c; paths=a,b; see=x, W-V5ONLY-ATTR; resource=catalog/c; paths=policy; see=x' } }, []);
  assert.deepStrictEqual(r.compatibilityWarnings(), ['W-PARTYROLE; resource=catalog/c; paths=a,b; see=x', 'W-V5ONLY-ATTR; resource=catalog/c; paths=policy; see=x']);
});
