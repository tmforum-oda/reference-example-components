'use strict';

// The interface both test clients share (spec 10.1), so a feature file runs
// against either one: create / get / list / patch / delete, plus a payload builder.
// Every call returns a Tmf620Response with the status, headers and body, and the
// problems found when checking the body against the client's own API specification.

const { resourceUrl, RESOURCES } = require('../support/config');
const { validate, validateResource } = require('./schemas');

class Tmf620Response {
  constructor(version, method, url, res, schemaErrors) {
    this.version = version;
    this.method = method;
    this.url = url;
    this.status = res.status;
    this.headers = res.headers || {};
    this.body = res.data;
    this.schemaErrors = schemaErrors;   // [] when valid, null when not checked
  }

  header(name) { return this.headers[name.toLowerCase()]; }

  // X-TMF-Compatibility-Warning values (the header may be repeated or comma-joined)
  compatibilityWarnings() {
    const raw = this.header('x-tmf-compatibility-warning');
    if (!raw) return [];
    const values = Array.isArray(raw) ? raw : [raw];
    return values.reduce((all, v) => all.concat(String(v).split(/,\s*(?=W-)/)), []).map(v => v.trim()).filter(Boolean);
  }

  describe() {
    return `${this.method} ${this.url} -> ${this.status}: ${JSON.stringify(this.body).slice(0, 600)}`;
  }
}

class Tmf620Client {
  constructor(version, { config, http, runId }) {
    this.version = version;
    this.config = config;
    this.http = http;
    this.runId = runId;
  }

  url(resource, id) { return resourceUrl(this.config, this.version, resource, id); }

  // Business content of a new resource -> a create body in this version's shape
  // (subclasses add what their version requires)
  build(resource, attributes) {
    return Object.assign({}, attributes);
  }

  // A name that marks the resource as created by this test run
  testName(name) { return `${name} [${this.runId}]`; }

  patchContentType() { return 'application/json'; }
  shapePatch(resource, body) { return body; }

  checked(method, url, res, resource) {
    let errors = null;
    const json = res.data !== undefined && res.data !== '' && typeof res.data === 'object';
    if (json && res.status >= 200 && res.status < 300) {
      errors = validateResource(this.version, resource, res.data);
    } else if (json && res.status >= 400 && this.errorSchema) {
      errors = validate(this.version, this.errorSchema, res.data);
    }
    return new Tmf620Response(this.version, method, url, res, errors);
  }

  async create(resource, body) {
    const url = this.url(resource);
    const res = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    return this.checked('POST', url, res, resource);
  }

  async get(resource, id, params) {
    const url = this.url(resource, id);
    const res = await this.http.get(url, { params });
    return this.checked('GET', url, res, resource);
  }

  async list(resource, params) {
    const url = this.url(resource);
    const res = await this.http.get(url, { params });
    return this.checked('GET', url, res, resource);
  }

  async patch(resource, id, body, contentType) {
    const url = this.url(resource, id);
    const res = await this.http.patch(url, this.shapePatch(resource, body), { headers: { 'Content-Type': contentType || this.patchContentType() } });
    return this.checked('PATCH', url, res, resource);
  }

  async delete(resource, id) {
    const url = this.url(resource, id);
    const res = await this.http.delete(url);
    return this.checked('DELETE', url, res, resource);
  }
}

module.exports = { Tmf620Client, Tmf620Response, RESOURCES };
