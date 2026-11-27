'use strict';

const fixtures = require('./fixtures');

let counter = 0;
const ctx = {
  componentName: 'r1-productcatalogmanagement',
  v4BaseUrl: fixtures.BASE4,
  idGenerator: () => `gen-${++counter}`
};

// Removes what the translation adds on the way to v5 and back, so a round trip can
// be compared with the original: @type values the original did not have.
function withoutAddedTypes(result, original) {
  if (Array.isArray(result)) return result.map((r, i) => withoutAddedTypes(r, Array.isArray(original) ? original[i] : undefined));
  if (!result || typeof result !== 'object') return result;
  const out = {};
  for (const k of Object.keys(result)) {
    if (k === '@type' && (!original || original['@type'] === undefined)) continue;
    out[k] = withoutAddedTypes(result[k], original ? original[k] : undefined);
  }
  return out;
}

function codes(list) { return list.map(p => p.code); }
function paths(list, code) { return list.filter(p => !code || p.code === code).map(p => p.path); }

module.exports = { ctx, fixtures, withoutAddedTypes, codes, paths };
