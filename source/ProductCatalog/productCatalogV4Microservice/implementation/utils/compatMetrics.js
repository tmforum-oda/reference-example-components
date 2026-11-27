'use strict';

// Compatibility metric reporter (issue #87, spec 7.3).
//
// Counts are summed per (code, resource, operation) and sent in one batch to the
// metrics microservice (POST METRICS_COMPATIBILITY_URL, an array of
// {code, resource, operation, count}). Fire and forget: a request never waits for
// the metrics service, and if it is down the counts are dropped with one log line
// per outage.

const axios = require('axios');
const compat = require('tmf620-compat');

// The shared reporter (tmf620-compat), posting with axios: this service runs on Node 16
function createReporter(options) {
  return compat.createReporter(Object.assign({ post: (u, body) => axios.post(u, body, { timeout: 2000 }) }, options));
}

let defaultReporter;
function reporter() {
  if (!defaultReporter) defaultReporter = createReporter({ url: process.env.METRICS_COMPATIBILITY_URL });
  return defaultReporter;
}

module.exports = { createReporter, reporter };
