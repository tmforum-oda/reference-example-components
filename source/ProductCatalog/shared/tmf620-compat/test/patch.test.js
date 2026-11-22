'use strict';

// PATCH through v4 over a stored v5 document (spec 6.1, matrix "PATCH from v4").

const test = require('node:test');
const assert = require('node:assert');
const { v4ToV5, v4Patch, mergePatch } = require('..');
const { ctx, fixtures, codes, paths } = require('./helpers');

const stored = (resource) => v4ToV5(resource, fixtures[resource], ctx).doc;

test('mergePatch follows RFC 7386', () => {
  assert.deepStrictEqual(mergePatch({ a: 1, b: { c: 2, d: 3 }, e: [1] }, { a: null, b: { c: 9 }, e: [2], f: 'x' }), { b: { c: 9, d: 3 }, e: [2], f: 'x' });
  assert.deepStrictEqual(mergePatch({ a: 1 }, 'x'), 'x');
});

test('a simple attribute patch changes only that attribute', () => {
  const s = stored('productOffering');
  const r = v4Patch('productOffering', s, { description: 'Now with 5G SA', lifecycleStatus: 'Retired' }, ctx);
  assert.deepStrictEqual(r.problems, []);
  assert.strictEqual(r.doc.description, 'Now with 5G SA');
  assert.strictEqual(r.doc.lifecycleStatus, 'Retired');
  assert.deepStrictEqual(Object.assign({}, r.doc, { description: s.description, lifecycleStatus: s.lifecycleStatus }), s);
});

test('v5-only attributes survive a v4 patch', () => {
  const s = Object.assign(stored('productOffering'), { externalIdentifier: [{ '@type': 'ExternalIdentifier', id: 'SKU-1' }] });
  const r = v4Patch('productOffering', s, { name: 'Renamed' }, ctx);
  assert.deepStrictEqual(r.doc.externalIdentifier, s.externalIdentifier);
});

test('relatedParty: partyId/partyName of a matched PartyRoleRef are kept', () => {
  const s = stored('catalog');
  s.relatedParty.push({ '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'manager', partyOrPartyRole: { '@type': 'PartyRoleRef', id: 'pr-9', partyId: 'ind-1', partyName: 'Sam Jones' } });
  const r = v4Patch('catalog', s, {
    relatedParty: [
      { id: 'org-001', name: 'Example Telco plc', role: 'owner', '@referredType': 'Organization' },
      { id: 'pr-9', role: 'manager', '@referredType': 'PartyRole' }
    ]
  }, ctx);
  assert.deepStrictEqual(r.problems, []);
  assert.strictEqual(r.doc.relatedParty[0].partyOrPartyRole.name, 'Example Telco plc');
  assert.deepStrictEqual(r.doc.relatedParty[1].partyOrPartyRole, { '@type': 'PartyRoleRef', id: 'pr-9', '@referredType': 'PartyRole', partyId: 'ind-1', partyName: 'Sam Jones' });
});

test('characteristics: internal ids and v5-only details of matched entries are kept', () => {
  const s = stored('productSpecification');
  const ids = s.productSpecCharacteristic.map(c => c.id);
  s.productSpecCharacteristic[0]['@valueSchemaLocation'] = 'https://example.test/schema/allowance.json';
  const view = require('..').v5ToV4('productSpecification', s, ctx).doc;
  const chars = view.productSpecCharacteristic;
  chars[0].description = 'Monthly data allowance';
  chars.splice(1, 1);                                     // remove Network technology
  chars.push({ name: 'Wi-Fi calling', valueType: 'boolean', productSpecCharacteristicValue: [{ value: true }] });
  const r = v4Patch('productSpecification', s, { productSpecCharacteristic: chars }, ctx);
  assert.deepStrictEqual(r.problems, []);
  const out = r.doc.productSpecCharacteristic;
  assert.deepStrictEqual(out.map(c => c.name), ['Data allowance', 'EU roaming', 'Hotspot allowance', 'Wi-Fi calling']);
  assert.deepStrictEqual(out.slice(0, 3).map(c => c.id), [ids[0], ids[2], ids[3]], 'stored ids kept');
  assert.ok(out[3].id && ids.indexOf(out[3].id) < 0, 'new characteristic gets a new id');
  assert.strictEqual(out[0]['@valueSchemaLocation'], 'https://example.test/schema/allowance.json');
  assert.strictEqual(out[0].description, 'Monthly data allowance');
  assert.strictEqual(out[3].characteristicValueSpecification[0]['@type'], 'BooleanCharacteristicValueSpecification');
});

test('a v4-only attribute in the patch is refused; stored problems are not reported', () => {
  const s = stored('productOfferingPrice');
  const r = v4Patch('productOfferingPrice', s, { constraint: [{ id: 'c-1' }] }, ctx);
  assert.deepStrictEqual(codes(r.problems), ['TMF620-COMPAT-422-V4ONLY-ATTR']);
  assert.strictEqual(r.doc, undefined);
});

test('Category parentId can be changed and removed through v4', () => {
  const s = stored('category');
  const moved = v4Patch('category', s, { parentId: 'catg-broadband' }, ctx);
  assert.deepStrictEqual(moved.doc.parent, { '@type': 'CategoryRef', id: 'catg-broadband', href: '/category/catg-broadband' });
  const root = v4Patch('category', s, { parentId: null, isRoot: true }, ctx);
  assert.strictEqual(root.doc.parent, undefined);
  assert.strictEqual(root.doc.isRoot, true);
});

test('O1: replacing prices that include an embedded price without id is refused with 409', () => {
  const s = stored('productOffering');
  s.productOfferingPrice.push({ '@type': 'ProductOfferingPrice', name: 'Embedded without id', priceType: 'oneTime' });
  const r = v4Patch('productOffering', s, { productOfferingPrice: [] }, ctx);
  assert.deepStrictEqual(codes(r.problems), ['TMF620-COMPAT-409-UNMATCHED']);
  assert.deepStrictEqual(paths(r.problems), ['productOfferingPrice']);
  const other = v4Patch('productOffering', s, { name: 'Still fine' }, ctx);
  assert.deepStrictEqual(other.problems, [], 'patching other attributes is fine');
  assert.strictEqual(other.doc.productOfferingPrice.length, 2);
});
