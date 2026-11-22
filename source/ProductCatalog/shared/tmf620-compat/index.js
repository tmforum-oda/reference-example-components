'use strict';

// TMF620 v4 <-> v5 compatibility, shared by the Product Catalog v4 and v5 APIs
// (issue #87). See specs/87-productcatalog-tmf620-v4-v5/compatibility-matrix.md.

const { toV5, toV4 } = require('./lib/translate');
const { v4Patch, mergePatch } = require('./lib/patch');
const { mapFilter, mapFields } = require('./lib/query');
const { normaliseHref, buildHref, mapHrefs } = require('./lib/href');
const { checkV5Value, allowedSubtypes } = require('./lib/charValue');
const { toTmfError, warningHeaders, CODES } = require('./lib/messages');
const { RESOURCES } = require('./lib/model');
const { migrateDocument } = require('./lib/migrate');

const STORAGE_SCHEMA = 'TMF620-5.0.0';

module.exports = {
  STORAGE_SCHEMA,
  RESOURCES,
  CODES,
  // v4 API
  v4ToV5: toV5,
  v5ToV4: toV4,
  v4Patch,
  mapFilter,
  mapFields,
  migrateDocument,
  // both
  normaliseHref,
  buildHref,
  mapHrefs,
  mergePatch,
  toTmfError,
  warningHeaders,
  // v5 API
  checkV5Value,
  allowedSubtypes
};
