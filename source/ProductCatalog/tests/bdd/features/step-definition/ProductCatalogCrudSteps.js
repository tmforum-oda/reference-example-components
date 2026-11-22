'use strict';

// CRUD and lifecycle steps on the telco catalogue (F001-F005, spec 10.3). Every
// step works through the current test client, so a scenario runs unchanged
// against v4 and v5. Entries are created with names tagged by the run id and
// deleted by the After hook.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const data = require('../../testData');

// Attributes a server may always return, even when `fields` selects others
const ALWAYS_RETURNED = ['id', 'href', '@type', '@baseType', '@schemaLocation', '@referredType'];

function telco(world) {
  world.telco = world.telco || {};
  return world.telco;
}

function context(world) {
  return {
    ref: (kind, key) => telco(world)[`${kind}/${key}`],
    name: n => world.client().testName(n)
  };
}

// Creates one catalogue entry through the current client and records it
async function createEntry(world, kind, key) {
  const client = world.client();
  const body = client.build(kind, data.payload(world.version, kind, key, context(world)));
  const res = await client.create(kind, body);
  world.debug(res.describe());
  if (res.status === 201 && res.body && res.body.id) {
    world.track(world.version, kind, res.body.id);
    telco(world)[`${kind}/${key}`] = { id: res.body.id, name: res.body.name };
    world.createdIds = world.createdIds || {};
    world.createdIds[kind] = res.body.id;
    world.created_ = world.created_ || {};
    world.created_[kind] = res.body;
  }
  return { res, body };
}

function created(world, kind) {
  const body = world.created_ && world.created_[kind];
  expect(body, `no ${kind} was created in this scenario`).to.be.an('object');
  return body;
}

// Every attribute that was sent is in the response with the same value. Arrays are
// compared item by item; the response may hold more (ids, hrefs, @type, defaults).
function missingContent(sent, received, path) {
  if (sent === null || typeof sent !== 'object') {
    return sent === received ? [] : [`${path || '(root)'}: sent ${JSON.stringify(sent)}, got ${JSON.stringify(received)}`];
  }
  if (Array.isArray(sent)) {
    if (!Array.isArray(received)) return [`${path}: sent an array, got ${JSON.stringify(received)}`];
    if (received.length !== sent.length) return [`${path}: sent ${sent.length} items, got ${received.length}`];
    return sent.reduce((all, item, i) => all.concat(missingContent(item, received[i], `${path}[${i}]`)), []);
  }
  if (received === null || typeof received !== 'object') return [`${path || '(root)'}: sent an object, got ${JSON.stringify(received)}`];
  return Object.keys(sent)
    .filter(k => k !== 'lastUpdate')   // set by the server
    .reduce((all, k) => all.concat(missingContent(sent[k], received[k], path ? `${path}.${k}` : k)), []);
}

async function listCreated(world, kind, extra) {
  const params = Object.assign({ name: created(world, kind).name }, extra);
  world.lastResponse = await world.client().list(kind, params);
  world.debug(world.lastResponse.describe());
}

function shiftedLastUpdate(world, kind, seconds) {
  const lastUpdate = created(world, kind).lastUpdate;
  expect(lastUpdate, `the created ${kind} has no lastUpdate`).to.be.a('string');
  return new Date(Date.parse(lastUpdate) + seconds * 1000).toISOString();
}

Given('the telco catalogue entries that the {string} {string} refers to exist', async function (kind, key) {
  for (const [k, x] of data.creationOrder([[kind, key]], { withoutRoots: true })) {
    const { res } = await createEntry(this, k, x);
    expect(res.status, `creating ${k} '${x}', which ${kind} '${key}' refers to: ${res.describe()}`).to.equal(201);
    expect(res.schemaErrors, `${k} '${x}': ${(res.schemaErrors || []).join('; ')}`).to.deep.equal([]);
  }
});

When('I create the {string} {string} from the telco catalogue', async function (kind, key) {
  const { res, body } = await createEntry(this, kind, key);
  this.lastResponse = res;
  this.lastSent = body;
});

Then('the response holds the content that was sent', function () {
  const res = this.lastResponse;
  expect(res.body, res.describe()).to.be.an('object');
  const missing = missingContent(this.lastSent, res.body, '');
  expect(missing, `${res.method} ${res.url} lost or changed what was sent:\n  ${missing.join('\n  ')}`).to.deep.equal([]);
});

When('I list {string} resources with the created name', async function (kind) {
  await listCreated(this, kind);
});

When('I list {string} resources with the created name and {string} {string}', async function (kind, attribute, value) {
  await listCreated(this, kind, { [attribute]: value });
});

// lastUpdate range filters, in the TMF630 'attribute>=value' form both APIs take
When('I list {string} resources with the created name, updated since it was created', async function (kind) {
  await listCreated(this, kind, { 'lastUpdate>': shiftedLastUpdate(this, kind, -60), 'lastUpdate<': shiftedLastUpdate(this, kind, 3600) });
});

When('I list {string} resources with the created name, updated before it was created', async function (kind) {
  await listCreated(this, kind, { 'lastUpdate<': shiftedLastUpdate(this, kind, -60) });
});

When('I list {string} resources with the created name and fields {string}', async function (kind, fields) {
  await listCreated(this, kind, { fields });
});

Then('the list holds only the created {string}', function (kind) {
  const res = this.lastResponse;
  expect(res.status, res.describe()).to.equal(200);
  expect(res.body, res.describe()).to.be.an('array');
  expect(res.body.map(r => r.id), res.describe()).to.deep.equal([created(this, kind).id]);
});

Then('the list is empty', function () {
  const res = this.lastResponse;
  expect(res.status, res.describe()).to.equal(200);
  expect(res.body, res.describe()).to.deep.equal([]);
});

Then('every listed item has only the attributes {string}', function (fields) {
  const res = this.lastResponse;
  const wanted = fields.split(',').map(f => f.trim());
  expect(res.body, res.describe()).to.be.an('array').that.is.not.empty;
  res.body.forEach(item => {
    wanted.forEach(f => expect(item, `${f} in ${JSON.stringify(item)}`).to.have.property(f));
    const extra = Object.keys(item).filter(k => wanted.indexOf(k) < 0 && ALWAYS_RETURNED.indexOf(k) < 0);
    expect(extra, `attributes not asked for in ${JSON.stringify(item)}`).to.deep.equal([]);
  });
});
