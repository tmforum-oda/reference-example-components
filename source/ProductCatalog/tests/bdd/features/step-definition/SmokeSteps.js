'use strict';

// Steps shared by every feature: pick a client, check the response.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('the TMF620 {string} API', function (version) {
  expect(['v4', 'v5'], `API version '${version}'`).to.include(version);
  this.version = version;
});

Given('the TMF620 {string} client', function (version) {
  expect(['v4', 'v5'], `API version '${version}'`).to.include(version);
  this.version = version;
});

When('I list {string} resources', async function (resource) {
  this.lastResponse = await this.client().list(resource, { limit: 1 });
  this.debug(this.lastResponse.describe());
});

Then('the response status is {int}', function (status) {
  const res = this.lastResponse;
  expect(res.status, res.describe()).to.equal(status);
});

// TMF630 paging: 200 when the page holds everything, 206 when there is more (the
// v4 service answers 206 once the store holds more than `limit` items)
Then('the response is a page of the list', function () {
  const res = this.lastResponse;
  expect([200, 206], res.describe()).to.include(res.status);
  expect(res.body, res.describe()).to.be.an('array');
  expect(res.schemaErrors, `${res.method} ${res.url}: ${(res.schemaErrors || []).join('; ')}`).to.deep.equal([]);
});

Then('the response body is a JSON array', function () {
  expect(this.lastResponse.body, 'response body').to.be.an('array');
});

Then('the response matches the TMF620 {string} specification', function (version) {
  const res = this.lastResponse;
  expect(res.version, 'the response was received by the other client').to.equal(version);
  expect(res.schemaErrors, `${res.method} ${res.url}: the body was not checked (status ${res.status})`).to.be.an('array');
  expect(res.schemaErrors, `${res.method} ${res.url} does not match the TMF620 ${version} specification:\n  ${(res.schemaErrors || []).join('\n  ')}`).to.deep.equal([]);
});
