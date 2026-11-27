'use strict';

// v4 list query -> v5 storage paths (matrix "Filters and fields").
//
//   mapFilter(resource, query)  -> {query, problems}
//   mapFields(resource, fields) -> {fields, problems}
//
// query is a plain object of query parameters. Paging and selection parameters pass
// through; every other key is an attribute filter, optionally followed by an operator
// (for example lastUpdate.gt or lastUpdate>=).

const { RESOURCES, v4Shape, v5Props, v5PropName } = require('./model');

const RESERVED = ['fields', 'offset', 'limit', 'sort', 'depth', 'expand'];
const RELATED_PARTY_REF_KEYS = ['id', 'href', 'name', '@referredType'];

function splitOperator(key) {
  const m = /^([^<>!=]+?)((?:\.(?:gt|gte|lt|lte|ne|eq|regex))|[<>!=]+)?$/.exec(key);
  return m ? { attr: m[1], op: m[2] || '' } : { attr: key, op: '' };
}

// Maps a dotted v4 attribute path. Returns {path, v4only, last: {d4, d5}}.
function mapPath(resource, v4path) {
  const info = RESOURCES[resource];
  const segs = v4path.split('.');
  let v4Name = info.v4Def;
  let v5Name = info.v5Def;
  const out = [];
  let last = {};
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (resource === 'category' && i === 0 && seg === 'parentId') {
      out.push('parent', 'id');
      last = { d4: { primitive: 'string' }, d5: { primitive: 'string' } };
      v4Name = v5Name = undefined;
      continue;
    }
    if (v4Name === 'RelatedParty' && RELATED_PARTY_REF_KEYS.indexOf(seg) >= 0) {
      out.push('partyOrPartyRole', seg);
      last = { d4: { primitive: 'string' }, d5: { primitive: 'string' } };
      v4Name = v5Name = undefined;
      continue;
    }
    const s4 = v4Shape(v4Name);
    const d4 = s4 ? s4.props[seg] : undefined;
    const seg5 = v5Name ? v5PropName(v5Name, seg) : seg;
    const d5 = v5Name ? v5Props(v5Name)[seg5] : undefined;
    if (d4 && !d5 && v5Name) return { path: v4path, v4only: true };
    out.push(seg5);
    last = { d4, d5 };
    if (!d4 && !d5) { out.push(...segs.slice(i + 1)); break; }   // unknown: leave as is
    v4Name = d4 && d4.ref;
    v5Name = d5 && d5.ref;
  }
  return { path: out.join('.'), v4only: false, last };
}

function convertValue(value, last) {
  // v4 string -> v5 integer (valueFrom / valueTo, matrix S3)
  if (last && last.d5 && last.d5.primitive === 'integer' && last.d4 && last.d4.primitive === 'string') {
    const values = String(value).split(',');
    if (!values.every(v => /^-?\d+$/.test(v.trim()))) return { error: `${JSON.stringify(value)} is not an integer` };
    return { value: values.map(v => v.trim()).join(',') };
  }
  return { value };
}

function mapFilter(resource, query) {
  const mapped = {};
  const problems = [];
  for (const key of Object.keys(query || {})) {
    if (RESERVED.indexOf(key) >= 0) { mapped[key] = query[key]; continue; }
    const { attr, op } = splitOperator(key);
    const m = mapPath(resource, attr);
    if (m.v4only) {
      problems.push({ code: 'TMF620-COMPAT-400-V4ONLY-FILTER', path: key, detail: 'TMF620 v5, the storage format, has no such attribute, so the filter could never match' });
      continue;
    }
    let value = query[key];
    if (resource === 'catalog' && attr === '@type' && value === 'Catalog') value = 'ProductCatalog';
    const c = convertValue(value, m.last);
    if (c.error) {
      problems.push({ code: 'TMF620-COMPAT-400-FILTER-VALUE', path: key, detail: c.error });
      continue;
    }
    mapped[m.path + op] = c.value;
  }
  return { query: mapped, problems };
}

// fields: comma-separated v4 attribute names -> top-level v5 attribute names
function mapFields(resource, fields) {
  if (fields === undefined || fields === null || fields === '') return { fields, problems: [] };
  const problems = [];
  const out = [];
  for (const raw of String(fields).split(',')) {
    const f = raw.trim();
    if (!f) continue;
    const m = mapPath(resource, f);
    if (m.v4only) {
      problems.push({ code: 'TMF620-COMPAT-400-V4ONLY-FILTER', path: `fields=${f}`, detail: 'TMF620 v5, the storage format, has no such attribute' });
      continue;
    }
    const top = m.path.split('.')[0];
    if (out.indexOf(top) < 0) out.push(top);
  }
  return { fields: out.join(','), problems };
}

module.exports = { mapFilter, mapFields, mapPath };
