'use strict';

// Startup migration of stored v4 documents to the TMF620 v5 storage format
// (issue #87, spec section 8, task T7).
//
// Every document in the five collections without the _schema marker is converted
// with tmf620-compat. Attributes TMF620 v5 has no home for are moved into the
// MigrationQuarantine collection (one record per document), so the main collections
// stay pure v5 and nothing is lost. Documents that cannot be converted without a
// person (for example a characteristic value that does not fit its valueType) are
// logged and left unchanged; the v4 API keeps serving them, the v5 API refuses them.
//
// Idempotent and safe to run from several replicas at once: a document is only
// replaced while it still has no _schema marker.

const compat = require('tmf620-compat');
const storage = require('./tmf620Storage');
const metrics = require('./compatMetrics');

const QUARANTINE = 'MigrationQuarantine';

function plainCopy(doc) {
  const copy = Object.assign({}, doc);
  delete copy._id;
  delete copy._schema;
  return copy;
}

// db: a MongoDB Db (driver 3.x API: collection().find().toArray(), replaceOne, updateOne)
async function migrate(db, options) {
  options = options || {};
  const log = options.log || (m => console.log(m));
  const reporter = options.reporter || metrics.reporter();
  const now = options.now || (() => new Date().toISOString());
  const summary = {};

  for (const collection of Object.keys(storage.RESOURCE_BY_TYPE)) {
    const resource = storage.RESOURCE_BY_TYPE[collection];
    const s = summary[resource] = { converted: 0, quarantined: 0, failed: 0, skipped: 0 };
    const legacy = await db.collection(collection).find({ _schema: { $ne: compat.STORAGE_SCHEMA } }).toArray();

    for (const stored of legacy) {
      if (stored.id === undefined || stored.id === null) {
        s.skipped++;
        log(`TMF620 migration: ${resource} with _id ${stored._id} has no id; left unchanged`);
        continue;
      }
      const r = compat.migrateDocument(resource, plainCopy(stored), { componentName: process.env.COMPONENT_NAME || 'r1-productcatalogmanagement' });
      if (!r.doc) {
        s.failed++;
        log(`TMF620 migration: ${resource}/${stored.id} cannot be converted and is left unchanged: ` +
          r.problems.map(p => `${p.path}: ${p.detail}${p.hint ? ' (' + p.hint + ')' : ''}`).join('; '));
        reporter.recordAll(r.problems, resource, 'migration');
        continue;
      }
      const doc = r.doc;
      doc._schema = compat.STORAGE_SCHEMA;
      if (stored._serviceType !== undefined) doc._serviceType = stored._serviceType;

      if (r.quarantined.length) {
        await db.collection(QUARANTINE).updateOne(
          { resourceType: collection, id: stored.id },
          { $set: { resourceType: collection, id: stored.id, removed: r.quarantined, migratedAt: now() } },
          { upsert: true });
      }
      const result = await db.collection(collection).replaceOne({ _id: stored._id, _schema: { $ne: compat.STORAGE_SCHEMA } }, doc);
      const matched = result.matchedCount !== undefined ? result.matchedCount : (result.result && result.result.n);
      if (!matched) { s.skipped++; continue; }   // another replica got there first, or it changed meanwhile
      s.converted++;
      if (r.quarantined.length) {
        s.quarantined++;
        log(`TMF620 migration: ${resource}/${stored.id}: moved ${r.quarantined.map(q => q.path).join(', ')} to ${QUARANTINE} (TMF620 v5 has no equivalent)`);
        reporter.record('W-V4ONLY-QUARANTINED', resource, 'migration', r.quarantined.length);
      }
    }
  }

  const total = Object.values(summary).reduce((t, s) => ({
    converted: t.converted + s.converted, quarantined: t.quarantined + s.quarantined, failed: t.failed + s.failed, skipped: t.skipped + s.skipped
  }), { converted: 0, quarantined: 0, failed: 0, skipped: 0 });
  log(`TMF620 migration done: ${total.converted} converted (${total.quarantined} with quarantined attributes), ${total.failed} left unchanged, ${total.skipped} skipped. ` +
    Object.keys(summary).map(k => `${k} ${summary[k].converted}/${summary[k].failed}`).join(', '));
  return { summary, total };
}

// Runs the migration once MongoDB is reachable; never stops the API from starting.
function migrateOnStartup(connect, options) {
  options = options || {};
  const attempts = options.attempts || 30;
  const delayMs = options.delayMs !== undefined ? options.delayMs : 10000;
  const log = options.log || (m => console.log(m));
  let attempt = 0;
  const run = () => {
    attempt++;
    return connect()
      .then(db => migrate(db, options))
      .catch(err => {
        if (attempt >= attempts) {
          log(`TMF620 migration: giving up after ${attempt} attempts: ${err.message || err}`);
          return undefined;
        }
        log(`TMF620 migration: attempt ${attempt} failed (${err.message || err}); retrying in ${delayMs / 1000} s`);
        return new Promise(resolve => setTimeout(resolve, delayMs)).then(run);
      });
  };
  return run();
}

module.exports = { migrate, migrateOnStartup, QUARANTINE };
