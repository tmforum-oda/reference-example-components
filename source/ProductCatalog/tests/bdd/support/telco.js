'use strict';

// Creating telco catalogue entries and named resources through either client,
// shared by the CRUD (F001-F005), cross-version (F006), compatibility (F007) and
// end-to-end (F008) steps.
//
// Every resource a scenario creates is recorded under an alias in world.named:
// a telco catalogue key ('ff1000') or a name the feature gives it ('the bundle').
// Telco entries are also kept in world.telco by 'kind/key', because a key can be
// used by two kinds (the 'home-bundle' specification and offering); references
// resolve through that map, and the alias holds the one created last.
// Ids are the same in both API versions (one shared store), so either client can
// read, patch or delete what the other created.

const data = require('../testData');

function named(world) {
  world.named = world.named || {};
  return world.named;
}

// The resource recorded under alias, or an error naming the aliases there are
function lookup(world, alias) {
  const r = named(world)[alias];
  if (!r) throw new Error(`nothing called '${alias}' was created in this scenario (have: ${Object.keys(named(world)).join(', ') || 'none'})`);
  return r;
}

// Records a created resource for cleanup and under its alias
function remember(world, version, kind, alias, res, sent) {
  if (res.status === 201 && res.body && res.body.id) {
    world.track(version, kind, res.body.id);
    named(world)[alias] = { kind, id: res.body.id, name: res.body.name, version, sent, created: res.body };
  }
}

// ctx for the payload builders: references resolve to entries created already
function telco(world) {
  world.telco = world.telco || {};
  return world.telco;
}

function telcoContext(world, version) {
  return {
    ref: (kind, key) => {
      const r = telco(world)[`${kind}/${key}`];
      return r ? { id: r.id, name: r.name } : undefined;
    },
    name: n => world.client(version).testName(n)
  };
}

// The body the client of `version` sends for a telco catalogue entry
function telcoBody(world, version, kind, key) {
  const client = world.client(version);
  return client.build(kind, data.payload(version, kind, key, telcoContext(world, version)));
}

async function createTelcoEntry(world, version, kind, key) {
  const body = telcoBody(world, version, kind, key);
  const res = await world.client(version).create(kind, body);
  world.debug(res.describe());
  remember(world, version, kind, key, res, body);
  if (named(world)[key] && named(world)[key].id === (res.body && res.body.id)) telco(world)[`${kind}/${key}`] = named(world)[key];
  return { res, body };
}

// Creates the entries the given roots refer to (and the roots unless withoutRoots),
// skipping any created already in this scenario. Throws on the first failure.
async function createTelcoEntries(world, version, roots, options) {
  const made = [];
  for (const [kind, key] of data.creationOrder(roots, options)) {
    if (telco(world)[`${kind}/${key}`]) continue;
    const { res } = await createTelcoEntry(world, version, kind, key);
    if (res.status !== 201) throw new Error(`creating ${kind} '${key}' through ${version}: ${res.describe()}`);
    if (res.schemaErrors && res.schemaErrors.length) throw new Error(`${kind} '${key}' (${version}) does not match the spec: ${res.schemaErrors.join('; ')}`);
    made.push([kind, key]);
  }
  return made;
}

// Replaces {{id:alias}} and {{name:alias}} in a feature's JSON, and adds a
// run-tagged name when the body has none
function resolveText(world, text) {
  return String(text).replace(/\{\{(id|name):([^}]+)\}\}/g, (_, what, alias) => lookup(world, alias.trim())[what]);
}

function resolveJson(world, text) {
  const resolved = resolveText(world, text);
  try {
    return JSON.parse(resolved);
  } catch (e) {
    throw new Error(`the JSON in the feature is not valid (${e.message}):\n${resolved}`);
  }
}

// Every attribute that was sent is in the response with the same value. Arrays are
// compared item by item; the response may hold more (ids, hrefs, @type, defaults).
function missingContent(sent, received, path) {
  path = path || '';
  if (sent === null || typeof sent !== 'object') {
    return sent === received ? [] : [`${path || '(root)'}: sent ${JSON.stringify(sent)}, got ${JSON.stringify(received)}`];
  }
  if (Array.isArray(sent)) {
    if (!Array.isArray(received)) return [`${path}: sent an array, got ${JSON.stringify(received)}`];
    if (received.length !== sent.length) return [`${path}: sent ${sent.length} items, got ${received.length}`];
    return sent.reduce((all, item, i) => all.concat(missingContent(item, received[i], `${path}[${i}]`)), []);
  }
  if (received === null || typeof received !== 'object') return [`${path || '(root)'}: sent an object, got ${JSON.stringify(received)}`];
  return Object.keys(sent)
    .filter(k => k !== 'lastUpdate')   // set by the server
    .reduce((all, k) => all.concat(missingContent(sent[k], received[k], path ? `${path}.${k}` : k)), []);
}

// Reads a dotted path ('price.value', 'relatedParty.0.role') from a body
function at(body, path) {
  return path.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), body);
}

module.exports = { named, telco, lookup, remember, telcoContext, telcoBody, createTelcoEntry, createTelcoEntries, resolveText, resolveJson, missingContent, at };
