'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { execFileSync } = require('child_process');
const c = require('..');
const { codes } = require('./helpers');

test('mapFilter: v4 filters become v5 storage paths', () => {
  assert.deepStrictEqual(c.mapFilter('category', { parentId: 'catg-mobile', 'lastUpdate.gt': '2026-01-01', limit: '10', fields: 'name' }).query,
    { 'parent.id': 'catg-mobile', 'lastUpdate.gt': '2026-01-01', limit: '10', fields: 'name' });
  assert.deepStrictEqual(c.mapFilter('catalog', { 'relatedParty.id': 'org-001', '@type': 'Catalog' }).query,
    { 'relatedParty.partyOrPartyRole.id': 'org-001', '@type': 'ProductCatalog' });
  assert.deepStrictEqual(c.mapFilter('productSpecification', { 'productSpecCharacteristic.name': 'EU roaming' }).query,
    { 'productSpecCharacteristic.name': 'EU roaming' });
  assert.deepStrictEqual(c.mapFilter('productSpecification', { 'productSpecCharacteristic.productSpecCharacteristicValue.valueFrom': '0' }).query,
    { 'productSpecCharacteristic.characteristicValueSpecification.valueFrom': '0' });
  assert.deepStrictEqual(c.mapFilter('productOffering', { marketingTag: 'x' }).query, { marketingTag: 'x' }, 'unknown attributes pass');
});

test('mapFilter: v4-only attributes and unconvertible values are 400', () => {
  const r = c.mapFilter('productOfferingPrice', { 'constraint.id': 'c-1', name: 'ok' });
  assert.deepStrictEqual(codes(r.problems), ['TMF620-COMPAT-400-V4ONLY-FILTER']);
  assert.deepStrictEqual(r.query, { name: 'ok' });
  const v = c.mapFilter('productSpecification', { 'productSpecCharacteristic.productSpecCharacteristicValue.valueTo': '10GB' });
  assert.deepStrictEqual(codes(v.problems), ['TMF620-COMPAT-400-FILTER-VALUE']);
});

test('mapFields: top-level v5 names, v4-only fields refused', () => {
  assert.deepStrictEqual(c.mapFields('category', 'name,parentId,version'), { fields: 'name,parent,version', problems: [] });
  assert.deepStrictEqual(c.mapFields('productOffering', undefined), { fields: undefined, problems: [] });
  assert.deepStrictEqual(codes(c.mapFields('productOfferingPrice', 'name,constraint').problems), ['TMF620-COMPAT-400-V4ONLY-FILTER']);
});

test('hrefs: normalise and build for both versions', () => {
  const comp = 'r1-productcatalogmanagement';
  assert.strictEqual(c.normaliseHref(`https://h/${comp}/tmf-api/productCatalogManagement/v4/catalog/c1`, comp), '/catalog/c1');
  assert.strictEqual(c.normaliseHref(`https://h/${comp}/tmf-api/productCatalogManagement/v5/productCatalog/c1`, comp), '/catalog/c1');
  assert.strictEqual(c.normaliseHref('https://elsewhere.test/catalog/c1', comp), 'https://elsewhere.test/catalog/c1');
  assert.strictEqual(c.buildHref('/catalog/c1', 'v4', 'https://h/x/v4/'), 'https://h/x/v4/catalog/c1');
  assert.strictEqual(c.buildHref('/catalog/c1', 'v5', 'https://h/x/v5'), 'https://h/x/v5/productCatalog/c1');
  assert.strictEqual(c.buildHref('https://other.test/a', 'v4', 'https://h/x/v4'), 'https://other.test/a');
});

test('toTmfError: one TMF Error listing every problem, most specific status wins', () => {
  const problems = [
    { code: 'TMF620-COMPAT-422-V4ONLY-ATTR', path: 'constraint', detail: 'TMF620 v5 has no equivalent attribute', hint: 'model the rule as a policy' },
    { code: 'TMF620-COMPAT-422-RANGE-NOT-INTEGER', path: 'x.valueTo', detail: '"10GB" is not an integer' }
  ];
  const e = c.toTmfError(problems, { resource: 'productOfferingPrice', id: 'pop-1', operation: 'create', v5Path: '/r1/tmf-api/productCatalogManagement/v5/productOfferingPrice' });
  assert.strictEqual(e.status, 422);
  assert.strictEqual(e.body['@type'], 'Error');
  assert.strictEqual(e.body.status, '422');
  assert.match(e.body.message, /productOfferingPrice pop-1 cannot be stored: 2 problems/);
  assert.match(e.body.message, /constraint: TMF620 v5 has no equivalent attribute \(model the rule as a policy\)/);
  assert.match(e.body.message, /x\.valueTo/);
  assert.match(e.body.message, /Use \/r1\/tmf-api\/productCatalogManagement\/v5\/productOfferingPrice/);
  assert.match(e.body.referenceError, /compatibility-matrix\.md#/);
  assert.deepStrictEqual(e.codes.sort(), ['TMF620-COMPAT-422-RANGE-NOT-INTEGER', 'TMF620-COMPAT-422-V4ONLY-ATTR']);
  const conflict = c.toTmfError(problems.concat({ code: 'TMF620-COMPAT-409-UNMATCHED', path: 'productOfferingPrice', detail: 'd' }), { resource: 'productOffering', id: 'po' });
  assert.strictEqual(conflict.status, 409);
  assert.strictEqual(conflict.body.code, 'TMF620-COMPAT-409-UNMATCHED');
  assert.strictEqual(c.toTmfError([{ code: 'TMF620-COMPAT-400-V4ONLY-FILTER', path: 'constraint.id', detail: 'd' }], { resource: 'productOfferingPrice' }).status, 400);
});

test('every code in the module is documented in the compatibility matrix', () => {
  const fs = require('fs');
  const matrix = fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', '..', 'specs', '87-productcatalog-tmf620-v4-v5', 'compatibility-matrix.md'), 'utf8');
  for (const code of Object.keys(c.CODES).concat(['W-V5ONLY-ATTR', 'W-PARTYROLE', 'W-EMBEDDED-POP', 'W-CHARVALUE-TYPE', 'W-V4ONLY-QUARANTINED'])) {
    assert.ok(matrix.indexOf(code) >= 0, code);
  }
});

test('warningHeaders: one header per code, paths de-duplicated', () => {
  const h = c.warningHeaders([
    { code: 'W-V5ONLY-ATTR', path: 'policy' }, { code: 'W-V5ONLY-ATTR', path: 'policy' }, { code: 'W-EMBEDDED-POP', path: 'productOfferingPrice[1]' }
  ], 'productOffering', 'po-1');
  assert.strictEqual(h.length, 2);
  assert.match(h[0], /^W-EMBEDDED-POP; resource=productOffering\/po-1; paths=productOfferingPrice\[1\]; see=https:/);
  assert.match(h[1], /^W-V5ONLY-ATTR; resource=productOffering\/po-1; paths=policy; see=/);
});

test('checkV5Value: v5 service value check (matrix S5)', () => {
  assert.strictEqual(c.checkV5Value({ '@type': 'BooleanCharacteristicValueSpecification', value: true }), undefined);
  assert.strictEqual(c.checkV5Value({ '@type': 'CharacteristicValueSpecification', value: 'x' }), undefined);
  assert.match(c.checkV5Value({ '@type': 'IntegerCharacteristicValueSpecification', value: 'Unlimited' }), /does not fit/);
  assert.match(c.checkV5Value({ '@type': 'Nonsense', value: 1 }), /not a TMF620 v5 characteristic value specification subtype/);
  assert.ok(c.allowedSubtypes().indexOf('StringArrayCharacteristicValueSpecification') >= 0);
});

test('generated shapes are up to date with both specifications', () => {
  execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'generate-shapes.js'), '--check'], { stdio: 'pipe' });
});
