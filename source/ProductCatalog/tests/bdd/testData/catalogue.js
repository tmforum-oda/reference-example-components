'use strict';

// Loads telco-catalogue.yaml (spec 10.2) and answers questions about it: one entry,
// the entries it refers to, and the order to create a set of entries in.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const KINDS = ['catalog', 'category', 'productSpecification', 'productOfferingPrice', 'productOffering'];

let cached;
function load() {
  if (!cached) cached = yaml.load(fs.readFileSync(path.join(__dirname, 'telco-catalogue.yaml'), 'utf8'));
  return cached;
}

function entry(kind, key) {
  const data = load();
  if (KINDS.indexOf(kind) < 0) throw new Error(`Unknown kind '${kind}' (expected one of ${KINDS.join(', ')})`);
  const e = data[kind] && data[kind][key];
  if (!e) throw new Error(`The telco catalogue has no ${kind} '${key}' (it has: ${Object.keys(data[kind] || {}).join(', ')})`);
  return e;
}

function party(key) {
  const p = load().parties[key];
  if (!p) throw new Error(`The telco catalogue has no party '${key}'`);
  return p;
}

function keys(kind) {
  return Object.keys(load()[kind] || {});
}

// The entries this entry refers to directly, as [kind, key] pairs
function references(kind, key) {
  const e = entry(kind, key);
  const refs = [];
  const add = (k, list) => (list || []).forEach(x => refs.push([k, x]));
  switch (kind) {
    case 'catalog': add('category', e.categories); break;
    case 'category': if (e.parent) refs.push(['category', e.parent]); break;
    case 'productSpecification': add('productSpecification', e.bundles); break;
    case 'productOfferingPrice': add('productOfferingPrice', (e.relationships || []).map(r => r.price)); break;
    case 'productOffering':
      if (e.specification) refs.push(['productSpecification', e.specification]);
      add('productOfferingPrice', e.prices);
      add('category', e.categories);
      add('productOffering', e.bundles);
      break;
  }
  return refs;
}

// Everything the given entries need, dependencies first, each once. The entries
// themselves come last unless `withoutRoots` is set.
function creationOrder(roots, { withoutRoots } = {}) {
  const order = [];
  const seen = new Set();
  const visit = (kind, key, stack) => {
    const id = `${kind}/${key}`;
    if (seen.has(id)) return;
    if (stack.indexOf(id) >= 0) throw new Error(`The telco catalogue refers in a circle: ${stack.concat(id).join(' -> ')}`);
    references(kind, key).forEach(([k, x]) => visit(k, x, stack.concat(id)));
    seen.add(id);
    order.push([kind, key]);
  };
  roots.forEach(([kind, key]) => visit(kind, key, []));
  if (!withoutRoots) return order;
  const rootIds = new Set(roots.map(([k, x]) => `${k}/${x}`));
  return order.filter(([k, x]) => !rootIds.has(`${k}/${x}`));
}

// The whole catalogue, in creation order
function everything() {
  return creationOrder(KINDS.flatMap(kind => keys(kind).map(key => [kind, key])));
}

module.exports = { KINDS, load, entry, party, keys, references, creationOrder, everything };
