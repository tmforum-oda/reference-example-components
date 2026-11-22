'use strict';

// Reads <component>_tmf620_compatibility_total from the metrics endpoint
// (PRODCAT_METRICS_URL, spec 7.3). The v4 service sends its counts in batches
// every couple of seconds, so a check for an increase waits for a while.

const METRIC = /^([a-zA-Z_:][a-zA-Z0-9_:]*_tmf620_compatibility_total)\{([^}]*)\}\s+([0-9.eE+-]+)/;

// Prometheus text -> [{labels, value}] for the compatibility counter
function parseCompatibilityCounter(text) {
  const series = [];
  String(text).split('\n').forEach(line => {
    const m = METRIC.exec(line.trim());
    if (!m) return;
    const labels = {};
    m[2].replace(/(\w+)="((?:[^"\\]|\\.)*)"/g, (_, k, v) => { labels[k] = v; });
    series.push({ labels, value: Number(m[3]) });
  });
  return series;
}

// Sum of the series whose labels include every given label
function total(series, match) {
  return series
    .filter(s => Object.keys(match).every(k => match[k] === undefined || s.labels[k] === match[k]))
    .reduce((sum, s) => sum + s.value, 0);
}

async function readCompatibilityCounter(world) {
  const res = await world.http.get(world.config.metricsUrl, { headers: { Accept: 'text/plain' }, responseType: 'text', transformResponse: x => x });
  if (res.status !== 200) throw new Error(`GET ${world.config.metricsUrl} -> ${res.status}; set PRODCAT_METRICS_URL to the metrics endpoint`);
  return { series: parseCompatibilityCounter(res.data) };
}

async function waitForCounterIncrease(world, before, match, timeoutMs) {
  const deadline = Date.now() + (timeoutMs || 10000);
  const start = total(before.series, match);
  let now = start;
  while (Date.now() < deadline) {
    now = total((await readCompatibilityCounter(world)).series, match);
    if (now > start) return now - start;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`the compatibility counter for ${JSON.stringify(match)} stayed at ${start} (now ${now}) at ${world.config.metricsUrl}`);
}

module.exports = { parseCompatibilityCounter, total, readCompatibilityCounter, waitForCounterIncrease };
