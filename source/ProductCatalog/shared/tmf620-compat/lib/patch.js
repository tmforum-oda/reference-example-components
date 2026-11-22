'use strict';

// v4 PATCH over a stored v5 document (spec 6.1 step 4, matrix "PATCH from v4").
//
//   v4Patch(resource, storedV5, v4patch, ctx) -> {doc, problems, warnings}
//
// 1. Build the v4 view of the stored document.
// 2. Apply the v4 merge-patch (RFC 7386) to the view.
// 3. Translate the result to v5 (this finds v4-only attributes in the patch).
// 4. Put the patched attributes into the stored document, matching array entries by
//    key so that v5-only details of matched entries are kept.
// A patch that replaces an attribute from which the v4 view had to leave out entries
// (for example embedded prices without id) is refused with 409.

const { RESOURCES, v4Shape, v5Props, resolveV5, v4DefFor, v4PropName, extendsSchema, clone } = require('./model');
const { toV5, toV4 } = require('./translate');

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function mergePatch(target, patch) {
  if (!isObject(patch)) return clone(patch);
  const result = isObject(target) ? clone(target) : {};
  for (const k of Object.keys(patch)) {
    if (patch[k] === null) delete result[k];
    else result[k] = mergePatch(result[k], patch[k]);
  }
  return result;
}

// Top-level v4 attribute -> top-level v5 attribute
function topV5Key(resource, key) {
  if (resource === 'category' && key === 'parentId') return 'parent';
  return key;
}

function matchKey(v5Name, item) {
  if (!isObject(item)) return undefined;
  if (v5Name === 'CharacteristicSpecification' || v5Name === 'ProductSpecificationCharacteristicValueUse') {
    return item.name !== undefined ? 'name:' + item.name : undefined;
  }
  if (v5Name === 'CharacteristicSpecificationRelationship') {
    return `rel:${item.parentSpecificationId}|${item.name}`;
  }
  if (v5Name === 'CharacteristicValueSpecification' || extendsSchema(v5Name, 'CharacteristicValueSpecification')) {
    return 'cvs:' + JSON.stringify([item.value, item.unitOfMeasure, item.valueFrom, item.valueTo]);
  }
  if (v5Name === 'RelatedPartyRefOrPartyRoleRef') {
    const ref = item.partyOrPartyRole || {};
    return `rp:${ref.id}|${item.role}`;
  }
  return item.id !== undefined ? 'id:' + item.id : undefined;
}

// Internal ids that the v4 view never shows: keep the stored one for a matched entry
const INTERNAL_IDS = ['CharacteristicSpecification', 'ProductSpecificationCharacteristicValueUse'];

function preserve(stored, fresh, v5Name) {
  if (Array.isArray(fresh)) {
    if (!Array.isArray(stored)) return fresh;
    const index = {};
    stored.forEach(s => { const k = matchKey(resolveV5(v5Name, s), s); if (k !== undefined && !(k in index)) index[k] = s; });
    return fresh.map(f => {
      const k = matchKey(resolveV5(v5Name, f), f);
      return k !== undefined && index[k] !== undefined ? preserve(index[k], f, v5Name) : f;
    });
  }
  if (!isObject(fresh) || !isObject(stored)) return fresh;

  const concrete = resolveV5(v5Name, fresh);
  const result = clone(fresh);

  if (concrete === 'RelatedPartyRefOrPartyRoleRef') {
    const s = stored.partyOrPartyRole || {};
    const f = result.partyOrPartyRole || {};
    if (s.id === f.id) {
      ['partyId', 'partyName'].forEach(k => { if (s[k] !== undefined && f[k] === undefined) f[k] = s[k]; });
      if (s['@type'] === 'PartyRoleRef' && (s.partyId !== undefined || s.partyName !== undefined)) f['@type'] = 'PartyRoleRef';
      result.partyOrPartyRole = f;
    }
    return result;
  }

  const props5 = v5Props(concrete);
  const shape4 = v4Shape(v4DefFor(concrete));
  const props4 = shape4 ? shape4.props : {};
  for (const key of Object.keys(stored)) {
    const isV5Only = props5[key] && !props4[v4PropName(concrete, key)];
    if (!(key in result)) {
      if (isV5Only) result[key] = clone(stored[key]);   // v4 could not see it: keep
    } else if (props5[key] && props5[key].ref) {
      result[key] = preserve(stored[key], result[key], props5[key].ref);
    }
  }
  if (INTERNAL_IDS.indexOf(concrete) >= 0 && stored.id !== undefined) result.id = stored.id;
  return result;
}

function v4Patch(resource, storedV5, v4patch, ctx) {
  const info = RESOURCES[resource];
  const view = toV4(resource, storedV5, ctx);
  const problems = [];

  for (const key of Object.keys(v4patch || {})) {
    const k5 = topV5Key(resource, key);
    if (view.omitted.indexOf(k5) >= 0) {
      problems.push({
        code: 'TMF620-COMPAT-409-UNMATCHED',
        path: key,
        detail: 'holds entries that TMF620 v4 cannot show (for example a price embedded by value without an id); replacing it through v4 would delete them'
      });
    }
  }
  if (problems.length) return { doc: undefined, problems, warnings: view.warnings };

  const patchedV4 = mergePatch(view.doc, v4patch);
  const conv = toV5(resource, patchedV4, ctx);
  // Only problems in attributes this patch touches count: the rest came from storage
  const touched = Object.keys(v4patch || {});
  const own = conv.problems.filter(p => touched.some(t => p.path === t || p.path.indexOf(t + '.') === 0 || p.path.indexOf(t + '[') === 0));
  if (own.length) return { doc: undefined, problems: own, warnings: conv.warnings };

  const merged = clone(storedV5);
  const props5 = v5Props(info.v5Def);
  for (const key of touched) {
    const k5 = topV5Key(resource, key);
    if (v4patch[key] === null) { delete merged[k5]; continue; }
    const d5 = props5[k5];
    merged[k5] = d5 && d5.ref ? preserve(storedV5[k5], conv.doc[k5], d5.ref) : conv.doc[k5];
  }
  return { doc: merged, problems: [], warnings: conv.warnings.filter(w => touched.some(t => w.path.indexOf(t) === 0)) };
}

module.exports = { v4Patch, mergePatch, preserve, matchKey };
