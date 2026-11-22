'use strict';

// Migration of a stored v4 document to the v5 storage format (spec section 8).
//
//   migrateDocument(resource, v4doc, ctx) -> {doc, quarantined, problems}
//
// Unlike a v4 request, stored data cannot be refused: attributes that TMF620 v5 has
// no home for (the TMF620-COMPAT-422-V4ONLY-ATTR cases) are moved out of the
// document and returned in `quarantined` ({path, value}), so they can be kept in a
// quarantine collection. Any other problem (a characteristic value that does not
// fit its type, a range that is not an integer, an ambiguous attachment) cannot be
// fixed without a person: `doc` is then undefined and `problems` says why.

const { toV5 } = require('./translate');
const { clone } = require('./model');

const V4ONLY = 'TMF620-COMPAT-422-V4ONLY-ATTR';

// "a.b[2].c" -> ['a', 'b', 2, 'c']
function parsePath(path) {
  const out = [];
  path.split('.').forEach(part => {
    const m = /^([^[]*)((?:\[\d+\])*)$/.exec(part);
    if (!m) { out.push(part); return; }
    if (m[1]) out.push(m[1]);
    (m[2].match(/\d+/g) || []).forEach(i => out.push(Number(i)));
  });
  return out;
}

function getAt(doc, segs) {
  return segs.reduce((node, s) => (node === undefined || node === null ? undefined : node[s]), doc);
}

function removeAt(doc, segs) {
  const parent = getAt(doc, segs.slice(0, -1));
  const last = segs[segs.length - 1];
  if (parent && typeof parent === 'object' && last in parent) {
    const value = parent[last];
    delete parent[last];
    return { found: true, value };
  }
  return { found: false };
}

function migrateDocument(resource, v4doc, ctx) {
  const source = clone(v4doc);
  const first = toV5(resource, source, ctx);
  const quarantined = [];
  let result = first;

  const v4only = first.problems.filter(p => p.code === V4ONLY);
  if (v4only.length) {
    const cleaned = clone(v4doc);
    for (const p of v4only) {
      const r = removeAt(cleaned, parsePath(p.path));
      if (r.found) quarantined.push({ path: p.path, value: r.value });
    }
    result = toV5(resource, cleaned, ctx);
  }

  if (result.problems.length) {
    return { doc: undefined, quarantined, problems: result.problems, warnings: result.warnings };
  }
  return { doc: result.doc, quarantined, problems: [], warnings: result.warnings };
}

module.exports = { migrateDocument, parsePath };
