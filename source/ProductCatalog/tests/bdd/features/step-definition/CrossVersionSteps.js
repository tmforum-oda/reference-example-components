'use strict';

// Steps that name the API version on every call, so one scenario can write
// through one version and read through the other (F006, F007, F008). Resources are
// referred to by an alias: a telco catalogue key or a name the scenario gives them.
// In JSON doc strings {{id:alias}} and {{name:alias}} are replaced by that
// resource's id and name; a body without a name gets one tagged with the run id.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const data = require('../../testData');
const { lookup, remember, telcoContext, createTelcoEntries, createTelcoEntry, resolveText, resolveJson, missingContent, at } = require('../../support/telco');
const { readCompatibilityCounter, waitForCounterIncrease } = require('../../support/metrics');

function respond(world, res) {
  world.lastResponse = res;
  world.debug(res.describe());
  return res;
}

// --- creating ---

Given('the telco catalogue entries that the {string} {string} refers to exist in {string}', async function (kind, key, version) {
  await createTelcoEntries(this, version, [[kind, key]], { withoutRoots: true });
});

async function createFromTelco(world, version, kind, key) {
  const { res, body } = await createTelcoEntry(world, version, kind, key);
  respond(world, res);
  world.lastSent = body;
  world.lastSentKind = kind;
  return res;
}

async function createWith(world, version, kind, alias, json) {
  const client = world.client(version);
  const attributes = resolveJson(world, json);
  if (attributes.name === undefined) attributes.name = client.testName(`F007 ${alias}`);
  const body = client.build(kind, attributes);
  const res = respond(world, await client.create(kind, body));
  world.lastSent = body;
  world.lastSentKind = kind;
  remember(world, version, kind, alias, res, body);
  return res;
}

When('the {string} client creates the {string} {string} from the telco catalogue', async function (version, kind, key) {
  await createFromTelco(this, version, kind, key);
});

When('the {string} client creates the {string} {string} with:', async function (version, kind, alias, json) {
  await createWith(this, version, kind, alias, json);
});

// Setup steps: the same calls, for a scenario that is about what happens next
Given('the {string} client has created the {string} {string} from the telco catalogue', async function (version, kind, key) {
  await createTelcoEntries(this, version, [[kind, key]], { withoutRoots: true });
  const res = await createFromTelco(this, version, kind, key);
  expect(res.status, res.describe()).to.equal(201);
});

Given('the {string} client has created the {string} {string} with:', async function (version, kind, alias, json) {
  const res = await createWith(this, version, kind, alias, json);
  expect(res.status, res.describe()).to.equal(201);
});

// --- reading and changing ---

When('the {string} client retrieves the {string}', async function (version, alias) {
  const r = lookup(this, alias);
  respond(this, await this.client(version).get(r.kind, r.id));
});

When('the {string} client patches the {string} with:', async function (version, alias, json) {
  const r = lookup(this, alias);
  respond(this, await this.client(version).patch(r.kind, r.id, resolveJson(this, json)));
});

Given('the {string} client has patched the {string} with:', async function (version, alias, json) {
  const r = lookup(this, alias);
  const res = respond(this, await this.client(version).patch(r.kind, r.id, resolveJson(this, json)));
  expect(res.status, res.describe()).to.equal(200);
});

When('the {string} client deletes the {string}', async function (version, alias) {
  const r = lookup(this, alias);
  respond(this, await this.client(version).delete(r.kind, r.id));
});

When('the {string} client lists {string} resources with:', async function (version, kind, table) {
  const params = {};
  table.raw().forEach(([key, value]) => { params[key] = resolveText(this, value); });
  respond(this, await this.client(version).list(kind, params));
});

// --- checking ---

function checkTelcoContent(world, version, kind, key, except) {
  const res = world.lastResponse;
  expect(res.body, res.describe()).to.be.an('object');
  // What that version's own builder would send for this entry, with the same ids
  const expected = data.payload(version, kind, key, telcoContext(world, version));
  (except || []).forEach(k => delete expected[k]);
  const missing = missingContent(expected, res.body);
  expect(missing, `${res.method} ${res.url} differs from the ${version} rendering of ${kind} '${key}':\n  ${missing.join('\n  ')}`).to.deep.equal([]);
}

Then('the response holds the {string} content of the telco {string} {string}', function (version, kind, key) {
  checkTelcoContent(this, version, kind, key);
});

Then('the response holds the {string} content of the telco {string} {string} apart from the description', function (version, kind, key) {
  checkTelcoContent(this, version, kind, key, ['description']);
});

Then('the list holds only {string}', function (aliases) {
  const res = this.lastResponse;
  expect(res.status, res.describe()).to.equal(200);
  expect(res.body, res.describe()).to.be.an('array');
  const expected = aliases.split(',').map(a => lookup(this, a.trim()).id).sort();
  expect(res.body.map(r => r.id).sort(), `${res.describe()}\nexpected ${aliases}`).to.deep.equal(expected);
});

Then('listing {string} resources by the name of the {string} gives the same ids in v4 and v5', async function (kind, alias) {
  const r = lookup(this, alias);
  const ids = {};
  for (const version of ['v4', 'v5']) {
    const res = await this.client(version).list(kind, { name: r.name });
    expect(res.status, res.describe()).to.equal(200);
    expect(res.schemaErrors, `${version} list: ${(res.schemaErrors || []).join('; ')}`).to.deep.equal([]);
    ids[version] = res.body.map(x => x.id).sort();
  }
  expect(ids.v4, 'ids listed by v4').to.deep.equal([r.id]);
  expect(ids.v5, 'ids listed by v5').to.deep.equal(ids.v4);
});

Then('the response attribute {string} equals:', function (path, json) {
  const res = this.lastResponse;
  expect(res.body, res.describe()).to.be.an('object');
  expect(at(res.body, path), `${path} in ${res.describe()}`).to.deep.equal(resolveJson(this, json));
});

Then('the response has no attribute {string}', function (path) {
  const res = this.lastResponse;
  expect(at(res.body, path), `${path} in ${res.describe()}`).to.equal(undefined);
});

Then('the response has no compatibility warnings', function () {
  const res = this.lastResponse;
  expect(res.compatibilityWarnings(), res.describe()).to.deep.equal([]);
});

// Header value: '<code>; resource=<type>/<id>; paths=<p1>,<p2>; see=<link>'
Then('the response has the compatibility warning {string} for {string}', function (code, path) {
  const res = this.lastResponse;
  const warnings = res.compatibilityWarnings();
  const mine = warnings.filter(w => w.split(';')[0].trim() === code);
  expect(mine, `no ${code} warning in ${JSON.stringify(warnings)} (${res.describe()})`).to.not.be.empty;
  const paths = mine.reduce((all, w) => {
    const m = /;\s*paths=([^;]*)/.exec(w);
    return all.concat(m ? m[1].split(',').map(p => p.trim()) : []);
  }, []);
  expect(paths, `${code} paths`).to.include(path);
});

Then('the response error code is {string}', function (code) {
  const res = this.lastResponse;
  expect(res.body && res.body.code, res.describe()).to.equal(code);
  expect(String(res.body.status), 'status in the error body').to.equal(String(res.status));
});

Then('the response message mentions {string}', function (text) {
  const res = this.lastResponse;
  expect(res.body && res.body.message, res.describe()).to.be.a('string').that.includes(resolveText(this, text));
});

Then('nothing was stored under the name that was sent', async function () {
  const name = this.lastSent && this.lastSent.name;
  expect(name, 'no body was sent').to.be.a('string');
  for (const version of ['v4', 'v5']) {
    const res = await this.client(version).list(this.lastSentKind, { name });
    expect(res.status, res.describe()).to.equal(200);
    expect(res.body, `${version}: ${res.describe()}`).to.deep.equal([]);
  }
});

Then('the {string} is gone in {string}', async function (alias, version) {
  const r = lookup(this, alias);
  const res = respond(this, await this.client(version).get(r.kind, r.id));
  expect(res.status, res.describe()).to.equal(404);
});

// --- the compatibility metric (spec 7.3) ---

Given('the TMF620 compatibility counter is read', async function () {
  this.counterBefore = await readCompatibilityCounter(this);
});

Then('the compatibility counter for {string} on {string} {string} went up', async function (code, resource, operation) {
  expect(this.counterBefore, 'read the counter first: "Given the TMF620 compatibility counter is read"').to.be.an('object');
  await waitForCounterIncrease(this, this.counterBefore, { code, resource, operation });
});
