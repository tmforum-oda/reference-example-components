'use strict';

// Shared state for one scenario: config, the HTTP client, the run id that tags
// test data, and the list of resources created so the After hook can delete them.

const https = require('https');
const crypto = require('crypto');
const axios = require('axios');
const { setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const { loadConfig, resourceUrl } = require('./config');
const { cleanupPlan } = require('./cleanup');
const { Tmf620V4Client } = require('../clients/Tmf620V4Client');
const { Tmf620V5Client } = require('../clients/Tmf620V5Client');

setDefaultTimeout(60 * 1000);

// One id per test run, so data from a run can be found (and cleaned up) even if
// the After hook never ran.
const RUN_ID = process.env.TMF620_RUN_ID || `bdd-${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(3).toString('hex')}`;

function createHttp(config) {
  const headers = { Accept: 'application/json' };
  if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`;
  return axios.create({
    timeout: config.requestTimeoutMs,
    headers,
    // Assertions are made on every status, so never throw on 4xx/5xx
    validateStatus: () => true,
    httpsAgent: new https.Agent({ rejectUnauthorized: !config.tlsInsecure })
  });
}

class Tmf620World {
  constructor({ attach, parameters }) {
    this.attach = attach;
    this.parameters = parameters;
    this.config = loadConfig();
    this.http = createHttp(this.config);
    this.runId = RUN_ID;
    this.created = [];       // {version, resource, id}
    this.lastResponse = undefined;
    const deps = { config: this.config, http: this.http, runId: this.runId };
    this.clients = { v4: new Tmf620V4Client(deps), v5: new Tmf620V5Client(deps) };
  }

  // The test client for 'v4' or 'v5'
  client(version) {
    const c = this.clients[version || this.version];
    if (!c) throw new Error(`Unknown TMF620 API version '${version || this.version}' (expected v4 or v5)`);
    return c;
  }

  // Records a created resource so it is deleted after the scenario.
  track(version, resource, id) {
    if (id) this.created.push({ version, resource, id });
  }

  // Deletes everything this scenario created; returns the resources it could not delete.
  async cleanup() {
    const failures = [];
    for (const r of cleanupPlan(this.created)) {
      const url = resourceUrl(this.config, r.version, r.resource, r.id);
      try {
        const res = await this.http.delete(url);
        if (res.status !== 204 && res.status !== 202 && res.status !== 404) {
          failures.push(`${r.resource}/${r.id} (${r.version}): DELETE returned ${res.status}`);
        }
      } catch (error) {
        failures.push(`${r.resource}/${r.id} (${r.version}): ${error.message}`);
      }
    }
    this.created = [];
    return failures;
  }

  debug(message) {
    if (this.config.debug) console.log(`[${this.runId}] ${message}`);
  }
}

setWorldConstructor(Tmf620World);

module.exports = { Tmf620World, RUN_ID, createHttp };
