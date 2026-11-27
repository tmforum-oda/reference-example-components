'use strict';

// End-to-end telco catalogue (F008): one client builds part of the catalogue,
// the other builds the rest on top of it, both list and filter all of it, and the
// scenario deletes everything itself and checks that nothing is left.

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { telco, createTelcoEntries } = require('../../support/telco');

Given('the {string} client builds the telco catalogue entries:', async function (version, table) {
  const roots = table.hashes().map(r => [r.kind, r.key]);
  this.builtBy = this.builtBy || {};
  for (const [kind, key] of await createTelcoEntries(this, version, roots)) this.builtBy[`${kind}/${key}`] = version;
});

Then('the {string} client built {int} telco catalogue entries', function (version, count) {
  const mine = Object.keys(this.builtBy || {}).filter(k => this.builtBy[k] === version);
  expect(mine.length, `built through ${version}: ${mine.join(', ')}`).to.equal(count);
});

Then('every telco catalogue entry built in this scenario is listed by name in v4 and v5', async function () {
  const entries = Object.keys(telco(this));
  expect(entries, 'nothing was built').to.not.be.empty;
  for (const entry of entries) {
    const [kind] = entry.split('/');
    const r = telco(this)[entry];
    for (const version of ['v4', 'v5']) {
      const res = await this.client(version).list(kind, { name: r.name });
      expect(res.status, res.describe()).to.equal(200);
      expect(res.schemaErrors, `${entry} listed by ${version}: ${(res.schemaErrors || []).join('; ')}`).to.deep.equal([]);
      expect(res.body.map(x => x.id), `${entry} listed by ${version}`).to.deep.equal([r.id]);
    }
  }
});

When('everything built in this scenario is deleted', async function () {
  this.deleted = this.created.slice();
  const failures = await this.cleanup();
  expect(failures, 'resources that could not be deleted').to.deep.equal([]);
});

Then('none of it can be found through v4 or v5', async function () {
  expect(this.deleted, 'nothing was deleted').to.not.be.empty;
  for (const r of this.deleted) {
    for (const version of ['v4', 'v5']) {
      const res = await this.client(version).get(r.resource, r.id);
      expect(res.status, `${r.resource}/${r.id} through ${version}: ${res.describe()}`).to.equal(404);
    }
  }
});
