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
const stored = require('./lib/stored');
const { createReporter } = require('./lib/metrics');

const STORAGE_SCHEMA = stored.STORAGE_SCHEMA;

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
  // stored documents (v4 startup migration, v5 migration of what it meets)
  migrateStored: stored.migrateStored,
  isMigrated: stored.isMigrated,
  describeProblems: stored.describeProblems,
  NOT_MIGRATED: stored.NOT_MIGRATED,
  QUARANTINE: stored.QUARANTINE,
  DEFAULT_LIFECYCLE_STATUS: stored.DEFAULT_LIFECYCLE_STATUS,
  // compatibility metric
  createReporter,
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
