'use strict';

// CRUD and lifecycle steps on the telco catalogue (F001-F005, spec 10.3). Every
// step works through the current test client, so a scenario runs unchanged
// against v4 and v5. Entries are created with names tagged by the run id and
// deleted by the After hook.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { createTelcoEntry, createTelcoEntries, missingContent } = require('../../support/telco');

// Attributes a server may always return, even when `fields` selects others
const ALWAYS_RETURNED = ['id', 'href', '@type', '@baseType', '@schemaLocation', '@referredType'];

// Creates one catalogue entry through the current client and records it as the
// scenario's resource of that kind
async function createEntry(world, kind, key) {
  const { res, body } = await createTelcoEntry(world, world.version, kind, key);
  if (res.status === 201 && res.body && res.body.id) {
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
  await createTelcoEntries(this, this.version, [[kind, key]], { withoutRoots: true });
});

When('I create the {string} {string} from the telco catalogue', async function (kind, key) {
  const { res, body } = await createEntry(this, kind, key);
  this.lastResponse = res;
  this.lastSent = body;
});

// Setup for a scenario about something other than the create: the entry, and what
// it refers to, exist through the current client
Given('the {string} {string} has been created from the telco catalogue', async function (kind, key) {
  await createTelcoEntries(this, this.version, [[kind, key]], { withoutRoots: true });
  const { res, body } = await createEntry(this, kind, key);
  expect(res.status, res.describe()).to.equal(201);
  this.lastResponse = res;
  this.lastSent = body;
});

Given('the created {string} is {string}', async function (kind, lifecycleStatus) {
  const res = await this.client().patch(kind, created(this, kind).id, { lifecycleStatus });
  this.debug(res.describe());
  expect(res.status, res.describe()).to.equal(200);
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
