'use strict';

// TMF620 v4/v5 compatibility counter (issue #87, spec section 7.3).
//
// The v4 Product Catalog API reports every compatibility warning and error it
// produces to POST /compatibility. Each report increments
// <component>_tmf620_compatibility_total{code, kind, resource, operation}.
//
// Label values are checked against fixed sets so the number of time series stays
// bounded: resource ids and attribute paths are never accepted as labels.
//
// Kept compatible with Node 10 (the runtime of this image).

const ERROR_CODES = [
  'TMF620-COMPAT-400-FILTER-VALUE',
  'TMF620-COMPAT-400-V4ONLY-FILTER',
  'TMF620-COMPAT-409-UNMATCHED',
  'TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS',
  'TMF620-COMPAT-422-CHARVALUE-TYPE',
  'TMF620-COMPAT-422-RANGE-NOT-INTEGER',
  'TMF620-COMPAT-422-V4ONLY-ATTR'
];

const WARNING_CODES = [
  'W-CHARVALUE-TYPE',
  'W-EMBEDDED-POP',
  'W-PARTYROLE',
  'W-V4ONLY-QUARANTINED',
  'W-V5ONLY-ATTR'
];

const RESOURCES = ['catalog', 'category', 'productOffering', 'productOfferingPrice', 'productSpecification'];
const OPERATIONS = ['create', 'read', 'list', 'patch', 'filter', 'migration'];
const MAX_COUNT_PER_REPORT = 10000;

function kindOf(code) {
  if (ERROR_CODES.indexOf(code) >= 0) return 'error';
  if (WARNING_CODES.indexOf(code) >= 0) return 'warning';
  return undefined;
}

// Returns {labels, count} for a valid report, or {error} describing what is wrong.
function validateReport(report) {
  if (report === null || typeof report !== 'object' || Array.isArray(report)) {
    return { error: 'each report must be an object {code, kind, resource, operation, count?}' };
  }
  const expectedKind = kindOf(report.code);
  if (!expectedKind) {
    return { error: 'unknown code "' + report.code + '"; allowed: ' + ERROR_CODES.concat(WARNING_CODES).join(', ') };
  }
  if (report.kind !== undefined && report.kind !== expectedKind) {
    return { error: 'code "' + report.code + '" is a ' + expectedKind + ', not a ' + report.kind };
  }
  if (RESOURCES.indexOf(report.resource) < 0) {
    return { error: 'unknown resource "' + report.resource + '"; allowed: ' + RESOURCES.join(', ') };
  }
  if (OPERATIONS.indexOf(report.operation) < 0) {
    return { error: 'unknown operation "' + report.operation + '"; allowed: ' + OPERATIONS.join(', ') };
  }
  let count = report.count === undefined ? 1 : report.count;
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT_PER_REPORT) {
    return { error: 'count must be an integer from 1 to ' + MAX_COUNT_PER_REPORT };
  }
  return {
    labels: { code: report.code, kind: expectedKind, resource: report.resource, operation: report.operation },
    count: count
  };
}

function createCompatibilityCounter(client, metricPrefix, register) {
  const config = {
    name: metricPrefix + '_tmf620_compatibility_total',
    help: 'TMF620 v4/v5 compatibility warnings and errors produced by the v4 API, by code',
    labelNames: ['code', 'kind', 'resource', 'operation']
  };
  if (register) config.registers = [register];  // tests use their own registry
  return new client.Counter(config);
}

// Express handler. Accepts one report or an array of reports. All are validated
// before any is counted, so a bad batch changes nothing.
function compatibilityHandler(counter) {
  return function (req, res) {
    const body = req.body;
    const reports = Array.isArray(body) ? body : [body];
    if (reports.length === 0) {
      res.status(400).send({ error: 'no reports' });
      return;
    }
    const valid = [];
    for (let i = 0; i < reports.length; i++) {
      const result = validateReport(reports[i]);
      if (result.error) {
        res.status(400).send({ error: 'report ' + i + ': ' + result.error });
        return;
      }
      valid.push(result);
    }
    valid.forEach(function (r) { counter.inc(r.labels, r.count); });
    res.status(204).end();
  };
}

module.exports = {
  ERROR_CODES: ERROR_CODES,
  WARNING_CODES: WARNING_CODES,
  RESOURCES: RESOURCES,
  OPERATIONS: OPERATIONS,
  kindOf: kindOf,
  validateReport: validateReport,
  createCompatibilityCounter: createCompatibilityCounter,
  compatibilityHandler: compatibilityHandler
};
