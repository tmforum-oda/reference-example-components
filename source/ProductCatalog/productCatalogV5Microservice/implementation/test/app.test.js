'use strict';

// Scaffold tests for the v5 API (task T9): routing, validation, TMF errors, docs,
// and how the validator treats the polymorphism cases in the compatibility matrix
// (S5 and G3). No MongoDB needed.

const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../app');

const COMPONENT = 'r1-productcatalogmanagement';
const BASE = `/${COMPONENT}/tmf-api/productCatalogManagement/v5`;
let server;
let origin;

test.before(async () => {
  server = createApp({ componentName: COMPONENT }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

async function call(method, path, body, contentType = 'application/json') {
  const res = await fetch(origin + BASE + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = undefined; }
  return { status: res.status, json, text, headers: res.headers };
}

function assertTmfError(r, status) {
  assert.strictEqual(r.status, status, r.text);
  assert.strictEqual(r.json['@type'], 'Error');
  assert.ok(r.json.code, 'code');
  assert.ok(r.json.reason, 'reason');
  assert.strictEqual(r.json.status, String(status));
}

const now = new Date().toISOString();
const spec = (characteristicValueSpecification) => ({
  '@type': 'ProductSpecification',
  name: '5G Mobile Service',
  lifecycleStatus: 'In design',
  lastUpdate: now,
  productSpecCharacteristic: [{
    '@type': 'CharacteristicSpecification',
    name: 'EU roaming',
    valueType: 'boolean',
    characteristicValueSpecification
  }]
});

test('entry point lists the v5 operations under the component base path', async () => {
  const r = await call('GET', '');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json._links.self.version, '5.0.0');
  assert.strictEqual(r.json._links.createProductCatalog.href, `${BASE}/productCatalog`);
  assert.strictEqual(r.json._links.createProductCatalog.method, 'POST');
});

test('Swagger UI and the OAS document are served', async () => {
  const docs = await fetch(origin + BASE + '/docs/');
  assert.strictEqual(docs.status, 200);
  assert.match(await docs.text(), /swagger-ui/i);
  const init = await call('GET', '/docs/swagger-initializer.js');
  assert.match(init.text, new RegExp(`${BASE}/api-docs`));
  const apiDocs = await call('GET', '/api-docs');
  assert.strictEqual(apiDocs.json.info.version, '5.0.0');
  assert.strictEqual(apiDocs.json.servers[0].url, BASE);
});

test('in-scope operations are routed and answer 501 until T10', async () => {
  const r = await call('GET', '/productCatalog?lifecycleStatus=Active&limit=5');
  assertTmfError(r, 501);
  assert.match(r.json.message, /listProductCatalog .* planned .* T10/);
});

test('out-of-scope operations answer 501 with the reason', async () => {
  const r = await call('POST', '/hub', { '@type': 'Hub', callback: 'http://example.test/listener' });
  assertTmfError(r, 501);
  assert.match(r.json.message, /createHub .* not part of this reference implementation/);
});

test('an invalid create body gives one 400 listing every problem', async () => {
  const r = await call('POST', '/productCatalog', { description: 'no @type or name' });
  assertTmfError(r, 400);
  assert.match(r.json.message, /@type/);
  assert.match(r.json.message, /name/);
});

test('the v4 catalog path does not exist in v5', async () => {
  const r = await call('GET', '/catalog');
  assertTmfError(r, 404);
});

test('malformed JSON gives a TMF 400', async () => {
  const r = await call('POST', '/productCatalog', '{"name": ');
  assertTmfError(r, 400);
});

test('PATCH accepts application/merge-patch+json bodies', async () => {
  const r = await call('PATCH', '/productOffering/po-1', { '@type': 'ProductOffering', lifecycleStatus: 'Active' }, 'application/merge-patch+json');
  assertTmfError(r, 501);   // passed validation and reached the handler
});

test('a valid StringCharacteristicValueSpecification passes validation', async () => {
  const r = await call('POST', '/productSpecification', spec([{ '@type': 'StringCharacteristicValueSpecification', value: '5G SA' }]));
  assertTmfError(r, 501);
});

// Characterisation tests: they record what express-openapi-validator does with the
// v5.0.0 OAS, so a change in the validator or the upstream spec is noticed.
//
// characteristicValueSpecification[] is typed as the base CharacteristicValueSpecification
// with a discriminator but no oneOf, so the validator checks the base schema only: it
// requires @type and checks valueFrom/valueTo, but does not check `value` against the
// subtype. The v5 service therefore runs its own check (shared tmf620-compat module,
// task T10), and these 501s become 422s for the mismatches.

test('matrix S5: BooleanCharacteristicValueSpecification is accepted (missing mapping does not block it)', async () => {
  const r = await call('POST', '/productSpecification', spec([{ '@type': 'BooleanCharacteristicValueSpecification', value: true }]));
  assertTmfError(r, 501);
});

test('validator gap: a value that does not fit its subtype is not caught by the OAS validator', async () => {
  const r = await call('POST', '/productSpecification', spec([{ '@type': 'IntegerCharacteristicValueSpecification', value: 'Unlimited' }]));
  assertTmfError(r, 501);   // T10: expect 422 from the service's own check
});

test('the validator does enforce @type and integer valueFrom on characteristic values', async () => {
  const r = await call('POST', '/productSpecification', spec([{ valueFrom: '10GB' }]));
  assertTmfError(r, 400);
  assert.match(r.json.message, /@type/);
  assert.match(r.json.message, /valueFrom: must be integer/);
});

test('matrix G3: a custom pricingLogicAlgorithm subtype with @schemaLocation passes validation', async () => {
  const r = await call('POST', '/productOfferingPrice', {
    '@type': 'ProductOfferingPrice',
    name: '5G Unlimited monthly',
    priceType: 'recurring',
    lifecycleStatus: 'In design',
    lastUpdate: now,
    pricingLogicAlgorithm: [{
      '@type': 'RecurringRatingPLA',
      '@schemaLocation': 'https://example.test/schema/RecurringRatingPLA.schema.json',
      name: 'Monthly rating'
    }]
  });
  assertTmfError(r, 501);
});
