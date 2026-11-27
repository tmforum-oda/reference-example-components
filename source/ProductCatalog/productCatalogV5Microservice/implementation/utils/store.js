'use strict';

// Document store shared with the v4 API (issue #87): the same MongoDB database and
// collections. A small in-memory store with the same interface is used by the tests.
//
// Interface (all async):
//   insert(collection, doc)
//   findOne(collection, criteria)
//   find(collection, criteria, {skip, limit, sort, projection}) -> docs
//   count(collection, criteria) -> number
//   replace(collection, criteria, doc) -> matched count
//   remove(collection, criteria) -> deleted count
//   upsert(collection, criteria, fields)   set fields on the matching document, or insert one

function mongoStore(options) {
  const { MongoClient } = require('mongodb');
  options = options || {};
  const url = options.url || process.env.MONGODB_URL ||
    `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}`;
  const database = options.database || process.env.MONGODB_DATABASE || 'tmf';
  let clientPromise;

  function db() {
    if (!clientPromise) {
      clientPromise = MongoClient.connect(url, { serverSelectionTimeoutMS: 5000 })
        .catch(err => { clientPromise = undefined; throw err; });
    }
    return clientPromise.then(client => client.db(database));
  }

  return {
    describe: () => `${url.replace(/\/\/[^@]*@/, '//***@')}/${database}`,
    async insert(c, doc) { await (await db()).collection(c).insertOne(doc); },
    async findOne(c, criteria) { return (await db()).collection(c).findOne(criteria); },
    async find(c, criteria, opts) {
      opts = opts || {};
      let cursor = (await db()).collection(c).find(criteria, { projection: opts.projection });
      if (opts.sort) cursor = cursor.sort(opts.sort);
      if (opts.skip) cursor = cursor.skip(opts.skip);
      if (opts.limit) cursor = cursor.limit(opts.limit);
      return cursor.toArray();
    },
    async count(c, criteria) { return (await db()).collection(c).countDocuments(criteria); },
    async replace(c, criteria, doc) { return (await (await db()).collection(c).replaceOne(criteria, doc)).matchedCount; },
    async remove(c, criteria) { return (await (await db()).collection(c).deleteOne(criteria)).deletedCount; },
    async upsert(c, criteria, fields) { await (await db()).collection(c).updateOne(criteria, { $set: fields }, { upsert: true }); },
    async close() { if (clientPromise) (await clientPromise).close(); clientPromise = undefined; }
  };
}

// ---------------------------------------------------------------------------
// In-memory store: enough of the Mongo query language for the queries this
// service builds (equality on dotted paths through arrays, $in, $ne, $gt, $gte,
// $lt, $lte, $regex, $exists).

function valuesAt(doc, path) {
  let current = [doc];
  for (const seg of path.split('.')) {
    const next = [];
    for (const v of current) {
      if (Array.isArray(v)) v.forEach(x => { if (x && typeof x === 'object' && seg in x) next.push(x[seg]); });
      else if (v && typeof v === 'object' && seg in v) next.push(v[seg]);
    }
    current = next;
  }
  // a path ending on an array matches each element, as in Mongo
  return current.reduce((all, v) => all.concat(Array.isArray(v) ? v.concat([v]) : [v]), []);
}

function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function matchCondition(values, cond) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond) && Object.keys(cond).some(k => k.charAt(0) === '$')) {
    return Object.keys(cond).every(op => {
      const arg = cond[op];
      switch (op) {
        case '$in': return values.some(v => arg.some(a => same(a, v)));
        case '$ne': return !values.some(v => same(v, arg));
        case '$nin': return !values.some(v => arg.some(a => same(a, v)));
        case '$gt': return values.some(v => v > arg);
        case '$gte': return values.some(v => v >= arg);
        case '$lt': return values.some(v => v < arg);
        case '$lte': return values.some(v => v <= arg);
        case '$regex': return values.some(v => typeof v === 'string' && new RegExp(arg, cond.$options).test(v));
        case '$options': return true;
        case '$exists': return arg ? values.length > 0 : values.length === 0;
        default: throw new Error('memoryStore: unsupported operator ' + op);
      }
    });
  }
  return values.some(v => same(v, cond));
}

function matches(doc, criteria) {
  return Object.keys(criteria || {}).every(k => {
    if (k === '$and') return criteria[k].every(c => matches(doc, c));
    return matchCondition(valuesAt(doc, k), criteria[k]);
  });
}

function project(doc, projection) {
  if (!projection) return doc;
  const out = {};
  Object.keys(projection).forEach(k => { if (projection[k] && doc[k] !== undefined) out[k] = doc[k]; });
  if (doc._id !== undefined && projection._id !== 0) out._id = doc._id;
  return out;
}

function memoryStore() {
  const collections = {};
  const coll = c => (collections[c] = collections[c] || []);
  const copy = d => JSON.parse(JSON.stringify(d));
  let seq = 0;
  return {
    collections,
    describe: () => 'memory',
    async insert(c, doc) { doc._id = doc._id || 'mem-' + (++seq); coll(c).push(copy(doc)); },
    async findOne(c, criteria) { const d = coll(c).find(x => matches(x, criteria)); return d ? copy(d) : null; },
    async find(c, criteria, opts) {
      opts = opts || {};
      let docs = coll(c).filter(x => matches(x, criteria));
      if (opts.sort) {
        const keys = Object.keys(opts.sort);
        docs = docs.slice().sort((a, b) => {
          for (const k of keys) {
            const av = valuesAt(a, k)[0]; const bv = valuesAt(b, k)[0];
            if (av === bv) continue;
            if (av === undefined) return 1;
            if (bv === undefined) return -1;
            return (av < bv ? -1 : 1) * opts.sort[k];
          }
          return 0;
        });
      }
      docs = docs.slice(opts.skip || 0, opts.limit ? (opts.skip || 0) + opts.limit : undefined);
      return docs.map(d => project(copy(d), opts.projection));
    },
    async count(c, criteria) { return coll(c).filter(x => matches(x, criteria)).length; },
    async replace(c, criteria, doc) {
      const i = coll(c).findIndex(x => matches(x, criteria));
      if (i < 0) return 0;
      coll(c)[i] = Object.assign(copy(doc), { _id: coll(c)[i]._id });
      return 1;
    },
    async remove(c, criteria) {
      const i = coll(c).findIndex(x => matches(x, criteria));
      if (i < 0) return 0;
      coll(c).splice(i, 1);
      return 1;
    },
    async upsert(c, criteria, fields) {
      const d = coll(c).find(x => matches(x, criteria));
      if (d) Object.assign(d, copy(fields));
      else coll(c).push(Object.assign({ _id: 'mem-' + (++seq) }, copy(criteria), copy(fields)));
    },
    async close() {}
  };
}

module.exports = { mongoStore, memoryStore, matches };
