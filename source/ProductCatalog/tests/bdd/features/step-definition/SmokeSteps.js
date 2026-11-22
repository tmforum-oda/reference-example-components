'use strict';

// Connectivity checks used by TMF620-F000. The full v4/v5 test clients come in T13.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { resourceUrl } = require('../../support/config');

Given('the TMF620 {string} API', function (version) {
  expect(['v4', 'v5'], `API version '${version}'`).to.include(version);
  this.version = version;
});

When('I list {string} resources', async function (resource) {
  const url = resourceUrl(this.config, this.version, resource);
  this.debug(`GET ${url}`);
  this.lastResponse = await this.http.get(url, { params: { limit: 1 } });
});

Then('the response status is {int}', function (status) {
  const res = this.lastResponse;
  expect(res.status, `${res.config.method.toUpperCase()} ${res.config.url} returned ${res.status}: ${JSON.stringify(res.data).slice(0, 500)}`).to.equal(status);
});

Then('the response body is a JSON array', function () {
  expect(this.lastResponse.data, 'response body').to.be.an('array');
});
