'use strict';

// One stored document from the v4 format to the v5 storage format (spec section 8),
// shared by the v4 API's startup migration and the v5 API, which migrates any
// document it meets that is still in the v4 format (for example one written by the
// previous v4 pod during a rolling upgrade, after the new pod's startup migration).
//
//   migrateStored(resource, stored, ctx) -> {doc, quarantine, quarantined, problems, defaulted}
//
// - doc: the document to store in place of `stored` (marked with STORAGE_SCHEMA,
//   without _id), or undefined when it cannot be converted (see problems)
// - quarantine: the MigrationQuarantine record to upsert, or undefined
// - defaulted: true when the document had no lifecycleStatus and was given
//   DEFAULT_LIFECYCLE_STATUS (mandatory in TMF620 responses; the published v4 image
//   before #87 never set it)
//
// Writes must be conditional on the document still having no marker, so that two
// writers (two replicas, or the v4 and v5 APIs) never convert the same document twice.

const { migrateDocument } = require('./migrate');

const STORAGE_SCHEMA = 'TMF620-5.0.0';
const QUARANTINE = 'MigrationQuarantine';
const DEFAULT_LIFECYCLE_STATUS = 'In design';   // the v4 and v5 APIs set the same on create
const COLLECTIONS = {
  catalog: 'Catalog', category: 'Category', productOffering: 'ProductOffering',
  productOfferingPrice: 'ProductOfferingPrice', productSpecification: 'ProductSpecification'
};

function isMigrated(stored) { return !!stored && stored._schema === STORAGE_SCHEMA; }

// Filter for documents of a collection that still need migrating
const NOT_MIGRATED = { _schema: { $ne: STORAGE_SCHEMA } };

function migrateStored(resource, stored, ctx, now) {
  const copy = Object.assign({}, stored);
  delete copy._id;
  delete copy._schema;
  const r = migrateDocument(resource, copy, ctx);
  if (!r.doc) return { doc: undefined, quarantine: undefined, quarantined: r.quarantined, problems: r.problems, defaulted: false };

  const doc = r.doc;
  doc._schema = STORAGE_SCHEMA;
  if (stored._serviceType !== undefined) doc._serviceType = stored._serviceType;
  const defaulted = doc.lifecycleStatus === undefined || doc.lifecycleStatus === null;
  if (defaulted) doc.lifecycleStatus = DEFAULT_LIFECYCLE_STATUS;
  const quarantine = r.quarantined.length
    ? { resourceType: COLLECTIONS[resource], id: stored.id, removed: r.quarantined, migratedAt: (now || (() => new Date().toISOString()))() }
    : undefined;
  return { doc, quarantine, quarantined: r.quarantined, problems: [], defaulted };
}

// Log text for a document that cannot be converted
function describeProblems(problems) {
  return problems.map(p => `${p.path}: ${p.detail}${p.hint ? ' (' + p.hint + ')' : ''}`).join('; ');
}

module.exports = { migrateStored, isMigrated, describeProblems, STORAGE_SCHEMA, QUARANTINE, DEFAULT_LIFECYCLE_STATUS, COLLECTIONS, NOT_MIGRATED };
