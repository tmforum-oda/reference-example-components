'use strict';

// Create / read / patch / delete through the current test client (T13). The full
// CRUD features (F001-F005) build on these.

const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

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

When('I create a minimal {string} named {string}', async function (resource, name) {
  const client = this.client();
  const res = await client.create(resource, client.build(resource, { name: client.testName(name) }));
  this.debug(res.describe());
  this.lastResponse = res;
  remember(this, resource, res);
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

Then('the response attribute {string} is {string}', function (attribute, value) {
  const body = this.lastResponse.body;
  expect(body, this.lastResponse.describe()).to.be.an('object');
  expect(String(body[attribute]), `${attribute} in ${this.lastResponse.describe()}`).to.equal(value);
});

Then('the response href is under the {string} base path', function (version) {
  const href = this.lastResponse.body && this.lastResponse.body.href;
  const base = new URL(this.config.baseUrls[version]).pathname;
  expect(href, this.lastResponse.describe()).to.be.a('string');
  const hrefPath = href.replace(/^https?:\/\/[^/]+/, '');
  expect(hrefPath.startsWith(base + '/'), `href ${href} is not under ${base}`).to.equal(true);
});
