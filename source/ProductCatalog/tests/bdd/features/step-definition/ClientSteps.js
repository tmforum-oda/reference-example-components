'use strict';

// Create / read / patch / delete through the current test client (T13). The full
// CRUD features (F001-F005) build on these.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { resolveText } = require('../../support/telco');

function remember(world, resource, res) {
  if (res.status === 201 && res.body && res.body.id) {
    world.track(world.version, resource, res.body.id);
    world.createdIds = world.createdIds || {};
    world.createdIds[resource] = res.body.id;
  }
}

function createdId(world, resource) {
  const id = world.createdIds && world.createdIds[resource];
  expect(id, `no ${resource} was created in this scenario`).to.be.a('string');
  return id;
}

async function createMinimal(world, resource, name) {
  const client = world.client();
  const res = await client.create(resource, client.build(resource, { name: client.testName(name) }));
  world.debug(res.describe());
  world.lastResponse = res;
  remember(world, resource, res);
  return res;
}

When('I create a minimal {string} named {string}', async function (resource, name) {
  await createMinimal(this, resource, name);
});

Given('a minimal {string} named {string} has been created', async function (resource, name) {
  const res = await createMinimal(this, resource, name);
  expect(res.status, res.describe()).to.equal(201);
});

When('I retrieve the created {string}', async function (resource) {
  this.lastResponse = await this.client().get(resource, createdId(this, resource));
  this.debug(this.lastResponse.describe());
});

When('I patch the created {string} with:', async function (resource, json) {
  this.lastResponse = await this.client().patch(resource, createdId(this, resource), JSON.parse(json));
  this.debug(this.lastResponse.describe());
});

When('I delete the created {string}', async function (resource) {
  this.lastResponse = await this.client().delete(resource, createdId(this, resource));
  this.debug(this.lastResponse.describe());
});

// `attribute` may be a dotted path, e.g. 'price.value'; `value` may hold {{id:alias}}
Then('the response attribute {string} is {string}', function (attribute, value) {
  value = resolveText(this, value);
  const body = this.lastResponse.body;
  // an object, or a list ('0.name')
  expect(body !== null && typeof body === 'object', this.lastResponse.describe()).to.equal(true);
  const actual = attribute.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), body);
  expect(String(actual), `${attribute} in ${this.lastResponse.describe()}`).to.equal(value);
});

Then('the response href is under the {string} base path', function (version) {
  const href = this.lastResponse.body && this.lastResponse.body.href;
  const base = new URL(this.config.baseUrls[version]).pathname;
  expect(href, this.lastResponse.describe()).to.be.a('string');
  const hrefPath = href.replace(/^https?:\/\/[^/]+/, '');
  expect(hrefPath.startsWith(base + '/'), `href ${href} is not under ${base}`).to.equal(true);
});
