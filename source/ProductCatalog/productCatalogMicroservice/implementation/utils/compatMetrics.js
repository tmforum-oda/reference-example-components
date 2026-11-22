'use strict';

// Compatibility metric reporter (issue #87, spec 7.3).
//
// Counts are summed per (code, resource, operation) and sent in one batch to the
// metrics microservice (POST METRICS_COMPATIBILITY_URL, an array of
// {code, resource, operation, count}). Fire and forget: a request never waits for
// the metrics service, and if it is down the counts are dropped with one log line
// per outage.

const axios = require('axios');

function createReporter(options) {
  options = options || {};
  const url = options.url;
  const flushMs = options.flushMs !== undefined ? options.flushMs : 2000;
  const post = options.post || ((u, body) => axios.post(u, body, { timeout: 2000 }));
  const log = options.log || (msg => console.log(msg));

  const pending = new Map();
  let timer = null;
  let failing = false;

  function record(code, resource, operation, count) {
    if (!url || !code) return;
    const key = [code, resource, operation].join('|');
    pending.set(key, (pending.get(key) || 0) + (count || 1));
    if (!timer) {
      timer = setTimeout(flush, flushMs);
      if (timer.unref) timer.unref();
    }
  }

  // Counts every problem or warning of one response, one count per code
  function recordAll(items, resource, operation) {
    const seen = {};
    (items || []).forEach(i => { seen[i.code] = (seen[i.code] || 0) + 1; });
    Object.keys(seen).forEach(code => record(code, resource, operation, seen[code]));
  }

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!pending.size) return Promise.resolve();
    const reports = Array.from(pending.entries()).map(([key, count]) => {
      const [code, resource, operation] = key.split('|');
      return { code, resource, operation, count };
    });
    pending.clear();
    return Promise.resolve()
      .then(() => post(url, reports))
      .then(() => {
        if (failing) { failing = false; log('compatibility metrics: reporting to ' + url + ' works again'); }
      })
      .catch(err => {
        if (!failing) {
          failing = true;
          log('compatibility metrics: could not report to ' + url + ' (' + err.message + '); counts are dropped until it is back');
        }
      });
  }

  return { record, recordAll, flush, pendingCount: () => pending.size };
}

let defaultReporter;
function reporter() {
  if (!defaultReporter) defaultReporter = createReporter({ url: process.env.METRICS_COMPATIBILITY_URL });
  return defaultReporter;
}

module.exports = { createReporter, reporter };
