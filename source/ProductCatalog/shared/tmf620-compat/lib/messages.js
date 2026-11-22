'use strict';

// Compatibility errors and warnings (spec section 7.2, compatibility-matrix.md).
//
// A "problem" stops the request: {code, path, detail, hint?}
// A "warning" is reported on a successful response: {code, path, detail?}

const MATRIX = 'https://github.com/tmforum-oda/reference-example-components/blob/master/specs/87-productcatalog-tmf620-v4-v5/compatibility-matrix.md';

const CODES = {
  'TMF620-COMPAT-400-FILTER-VALUE': { status: 400, row: 's3', reason: 'Filter value cannot be converted to the TMF620 v5 storage type' },
  'TMF620-COMPAT-400-V4ONLY-FILTER': { status: 400, row: 'filters-and-fields-v4--v5-storage-paths', reason: 'Filter or field on an attribute that TMF620 v5 does not have' },
  'TMF620-COMPAT-409-UNMATCHED': { status: 409, row: 'o1', reason: 'Update would discard data that only the TMF620 v5 API can represent' },
  'TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS': { status: 422, row: 's8', reason: 'Attachment is neither a reference nor a value' },
  'TMF620-COMPAT-422-CHARVALUE-TYPE': { status: 422, row: 's2', reason: 'Characteristic value does not fit its type' },
  'TMF620-COMPAT-422-RANGE-NOT-INTEGER': { status: 422, row: 's3', reason: 'Characteristic value range is not an integer' },
  'TMF620-COMPAT-422-V4ONLY-ATTR': { status: 422, row: 'p1', reason: 'Request sets attributes that TMF620 v5 cannot store' }
};

// What to do instead, for each v4-only attribute (matrix S4, S6, S7, O3, P1)
const V4ONLY_HINTS = [
  [/(^|\.)constraint(\[\d+\])?$/, 'v5 ProductOfferingPrice has no constraint; model the rule as a policy (PolicyRef) through the v5 API'],
  [/charSpecSeq$/, 'v5 has no sequence number on characteristic relationships; order the relationship array instead'],
  [/targetServiceSchema$/, 'v5 ServiceSpecificationRef has no targetServiceSchema; reference the service specification only'],
  [/targetProductSchema\.@baseType$/, 'v5 TargetProductSchema has only @type and @schemaLocation'],
  [/bundledProductOffering(\[\d+\])?\.lifecycleStatus$/, 'v5 bundled offering references have no lifecycleStatus; it is an attribute of the bundled offering itself']
];

function v4OnlyHint(path) {
  const found = V4ONLY_HINTS.find(([re]) => re.test(path));
  return found ? found[1] : 'TMF620 v5 has no equivalent attribute';
}

function statusOf(code) { return CODES[code] ? CODES[code].status : 422; }

// One TMF Error for all problems of a request. ctx: {resource, id, operation, v5Path}
function toTmfError(problems, ctx) {
  const sorted = problems.slice().sort((a, b) => statusOf(a.code) - statusOf(b.code));
  // The most specific status wins: 409 over 422 over 400
  const order = [409, 422, 400];
  const status = order.find(s => problems.some(p => statusOf(p.code) === s)) || 422;
  const main = problems.find(p => statusOf(p.code) === status);
  const target = ctx.id ? `${ctx.resource} ${ctx.id}` : ctx.resource;
  const lines = sorted.map(p => `${p.path}: ${p.detail}${p.hint ? ' (' + p.hint + ')' : ''}`);
  const v5 = ctx.v5Path ? ` Use ${ctx.v5Path} for data that only TMF620 v5 can represent.` : '';
  const intro = status === 409
    ? `${target} was not changed: this update through TMF620 v4 would delete data that v4 cannot show.`
    : status === 400
      ? `This ${ctx.resource} query cannot be run against TMF620 v5 storage.`
      : `${target} cannot be stored: ${problems.length} problem${problems.length > 1 ? 's' : ''} converting it to TMF620 v5, the format this component stores.`;
  return {
    status,
    body: {
      '@type': 'Error',
      code: main.code,
      status: String(status),
      reason: CODES[main.code] ? CODES[main.code].reason : 'TMF620 v4/v5 compatibility problem',
      message: `${intro} ${lines.join('; ')}.${v5}`,
      referenceError: `${MATRIX}#${CODES[main.code] ? CODES[main.code].row : ''}`
    },
    codes: Array.from(new Set(problems.map(p => p.code)))
  };
}

// Groups warnings by code into X-TMF-Compatibility-Warning header values.
function warningHeaders(warnings, resource, id) {
  const byCode = {};
  for (const w of warnings) (byCode[w.code] = byCode[w.code] || []).push(w.path);
  return Object.keys(byCode).sort().map(code =>
    `${code}; resource=${resource}/${id || '-'}; paths=${Array.from(new Set(byCode[code])).join(',')}; see=${MATRIX}`
  );
}

module.exports = { CODES, MATRIX, toTmfError, warningHeaders, v4OnlyHint };
