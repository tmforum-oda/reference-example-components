'use strict';

// TMF list query parameters -> MongoDB query (TMF630 filtering, simple form).
//
//   name=Full Fibre 500                      equality (comma-separated values: any of)
//   lastUpdate.gte=2026-01-01 / lastUpdate>=2026-01-01
//   price.value.lt=30 / lifecycleStatus.ne=Retired / name.regex=^5G
//   fields=name,lifecycleStatus  offset=0  limit=10  sort=-lastUpdate,name
//
// Values are matched as strings and, where they look like one, as numbers or
// booleans. Date-times are stored as ISO strings, so ranges compare correctly.

const RESERVED = ['fields', 'offset', 'limit', 'sort', 'depth', 'expand'];
const OPS = { gt: '$gt', gte: '$gte', lt: '$lt', lte: '$lte', ne: '$ne', eq: undefined, regex: '$regex' };
// The fields every response keeps, whatever ?fields= asks for
const ALWAYS = ['id', 'href', '@type'];

function typed(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function candidates(v) {
  const t = typed(v);
  return t === v ? [v] : [v, t];
}

function parsePair(key, value) {
  let m = /^(.+)\.(gt|gte|lt|lte|ne|eq|regex)$/.exec(key);
  if (m) return { attr: m[1], op: OPS[m[2]], value };
  m = /^(.+?)([<>!])$/.exec(key);               // a>=b, a<=b, a!=b
  if (m) return { attr: m[1], op: { '>': '$gte', '<': '$lte', '!': '$ne' }[m[2]], value };
  if (value === '') {
    m = /^(.+?)([<>])(.+)$/.exec(key);           // a>b, a<b
    if (m) return { attr: m[1], op: m[2] === '>' ? '$gt' : '$lt', value: m[3] };
  }
  return { attr: key, op: undefined, value };
}

// rawQuery: the query string (without '?'). Returns {criteria, options, problems}.
function buildQuery(rawQuery) {
  const params = new URLSearchParams(rawQuery || '');
  const criteria = {};
  const options = {};
  const problems = [];
  const and = [];

  for (const [key, value] of params) {
    if (RESERVED.indexOf(key) >= 0) {
      if (key === 'fields' && value && value !== 'none') {
        const fields = value.split(',').map(f => f.trim().split('.')[0]).filter(Boolean);
        options.projection = {};
        fields.concat(ALWAYS, ['_schema']).forEach(f => { options.projection[f] = 1; });
        options.fields = fields;
      } else if (key === 'offset' || key === 'limit') {
        if (!/^\d+$/.test(value)) problems.push(`${key}: "${value}" is not a non-negative integer`);
        else options[key === 'offset' ? 'skip' : 'limit'] = parseInt(value, 10);
      } else if (key === 'sort' && value) {
        options.sort = {};
        value.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
          if (s.charAt(0) === '-') options.sort[s.slice(1)] = -1;
          else options.sort[s.replace(/^\+/, '')] = 1;
        });
      }
      continue;
    }
    const { attr, op, value: v } = parsePair(key, value);
    if (attr.charAt(0) === '_' || attr.indexOf('$') >= 0) {
      problems.push(`${attr}: not a filterable attribute`);
      continue;
    }
    let cond;
    if (op === '$regex') {
      try { new RegExp(v); } catch (e) { problems.push(`${key}: invalid regular expression`); continue; }
      cond = { $regex: v };
    } else if (op === '$ne') {
      cond = { $nin: candidates(v) };
    } else if (op) {
      cond = { [op]: typed(v) };
    } else {
      const values = v.split(',').reduce((all, x) => all.concat(candidates(x)), []);
      cond = values.length === 1 ? values[0] : { $in: values };
    }
    if (criteria[attr] !== undefined) and.push({ [attr]: cond });
    else criteria[attr] = cond;
  }
  if (and.length) criteria.$and = and;
  return { criteria, options, problems };
}

// Keeps only the requested fields (plus id, href, @type) in a response document
function projectDoc(doc, fields) {
  if (!fields) return doc;
  const keep = fields.concat(ALWAYS);
  Object.keys(doc).forEach(k => { if (keep.indexOf(k) < 0) delete doc[k]; });
  return doc;
}

module.exports = { buildQuery, projectDoc, RESERVED };
