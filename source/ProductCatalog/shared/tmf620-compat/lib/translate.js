'use strict';

// v4 <-> v5 translation of the five TMF620 resources (compatibility-matrix.md).
//
//   toV5(resource, v4doc, ctx) -> {doc, problems, warnings}    v4 write -> v5 storage
//   toV4(resource, v5doc, ctx) -> {doc, warnings, omitted}     v5 storage -> v4 read
//
// Structural differences (relatedParty, Category parent, characteristic renames and
// value types, attachments, embedded prices, hrefs) are handled here. Everything else
// is handled by walking the document against the generated v4 and v5 shapes: an
// attribute that one version defines and the other does not is reported (v4-only on
// write -> problem, v5-only on read -> warning). Attributes neither version defines
// (TMF extensions with @schemaLocation) pass through unchanged.

const crypto = require('crypto');
const model = require('./model');
const { RESOURCES, v4Shape, v5Shape, v5Props, resolveV5, v4DefFor, isExtensible, v4PropName, clone } = model;
const { inferV5Type, toIntegerRange } = require('./charValue');
const { normaliseHref, buildHref, mapHrefs } = require('./href');
const { v4OnlyHint } = require('./messages');

const OPAQUE_V5 = ['RelatedPartyRefOrPartyRoleRef', 'PartyRefOrPartyRoleRef'];

// v5-only attributes that are internal keys: dropped from the v4 view without a
// warning (they are kept on PATCH by the array merge)
const SILENT_V5_ONLY = {
  CharacteristicSpecification: ['id'],
  ProductSpecificationCharacteristicValueUse: ['id']
};

// Attribute renames used by the walk to line up v5 and v4 property names
model.RENAMES_V5_TO_V4.Category = { parent: 'parentId' };

// Nodes already refused for a more specific reason; the walk does not report them again
const REPORTED = new WeakSet();

function joinPath(path, key) { return path ? `${path}.${key}` : key; }

function resourceInfo(resource) {
  const r = RESOURCES[resource];
  if (!r) throw new Error(`Unknown TMF620 resource '${resource}'`);
  return r;
}

// ---------------------------------------------------------------------------
// Generic walk over a v5-shaped document

function walk(node, v5Name, v4Name, mode, path, out) {
  if (Array.isArray(node)) {
    node.forEach((n, i) => walk(n, v5Name, v4Name, mode, `${path}[${i}]`, out));
    return;
  }
  if (!node || typeof node !== 'object' || !v5Name || REPORTED.has(node)) return;
  const shape5 = v5Shape(v5Name);
  if (!shape5) return;
  const concrete = resolveV5(v5Name, node);
  if (OPAQUE_V5.indexOf(concrete) >= 0) return;

  // On write, an attribute is v4-only only if no member of a oneOf knows it
  const props5 = mode === 'toV5' && shape5.oneOf ? v5Props(v5Name) : v5Props(concrete);
  const v4n = v4Name || v4DefFor(concrete);
  const shape4 = v4Shape(v4n);
  const props4 = shape4 ? shape4.props : null;

  if (props4) {
    for (const key of Object.keys(node)) {
      if (key === '@type' || key.charAt(0) === '_') continue;
      const key4 = v4PropName(concrete, key);
      const d5 = props5[key];
      const d4 = props4[key4];
      if (mode === 'toV5') {
        if (d4 && !d5) {
          out.problems.push({ code: 'TMF620-COMPAT-422-V4ONLY-ATTR', path: joinPath(path, key4), detail: 'TMF620 v5 has no equivalent attribute', hint: v4OnlyHint(joinPath(path, key4)) });
          continue;
        }
      } else if (d5 && !d4) {
        delete node[key];
        if ((SILENT_V5_ONLY[concrete] || []).indexOf(key) < 0) {
          out.warnings.push({ code: 'W-V5ONLY-ATTR', path: joinPath(path, key) });
        }
        continue;
      }
      if (d5 && d5.ref) walk(node[key], d5.ref, d4 && d4.ref, mode, joinPath(path, key4), out);
    }
  }
  // Matrix G2: every Extensible v5 object needs @type
  if (mode === 'toV5' && node['@type'] === undefined && !shape5.oneOf && isExtensible(concrete)) {
    node['@type'] = concrete;
  }
}

// ---------------------------------------------------------------------------
// Structural transforms, v4 -> v5

// Only catalog and productSpecification define relatedParty (in both versions). On the
// other resources it is an extension attribute and passes through unchanged.
function hasRelatedParty(info) {
  return !!v5Props(info.v5Def).relatedParty;
}

function relatedPartyToV5(list) {
  if (!Array.isArray(list)) return list;
  return list.map(rp => {
    if (!rp || typeof rp !== 'object' || rp.partyOrPartyRole) return rp;   // already v5
    const referred = rp['@referredType'];
    const isRole = rp['@type'] === 'PartyRoleRef' || (typeof referred === 'string' && /role$/i.test(referred));
    const ref = { '@type': isRole ? 'PartyRoleRef' : 'PartyRef' };
    ['id', 'href', 'name', '@referredType', '@schemaLocation', '@baseType'].forEach(k => { if (rp[k] !== undefined) ref[k] = rp[k]; });
    const wrapper = { '@type': 'RelatedPartyRefOrPartyRoleRef', partyOrPartyRole: ref };
    if (rp.role !== undefined) wrapper.role = rp.role;
    return wrapper;
  });
}

function charValuesToV5(values, parentValueType, path, out) {
  if (!Array.isArray(values)) return values;
  values.forEach((cvs, i) => {
    if (!cvs || typeof cvs !== 'object') return;
    const p = `${path}[${i}]`;
    const t = inferV5Type(cvs, parentValueType);
    if (t.error) {
      out.problems.push({ code: 'TMF620-COMPAT-422-CHARVALUE-TYPE', path: p, detail: t.error, hint: 'TMF620 v5 types each value with its @type, for example StringCharacteristicValueSpecification; set valueType to match the value' });
      REPORTED.add(cvs);
    } else {
      if (t.replaced) out.warnings.push({ code: 'W-CHARVALUE-TYPE', path: `${p}.@type`, detail: `${t.replaced} stored as ${t.type}` });
      cvs['@type'] = t.type;
    }
    ['valueFrom', 'valueTo'].forEach(k => {
      if (cvs[k] === undefined) return;
      const r = toIntegerRange(cvs[k]);
      if (r.error) {
        out.problems.push({ code: 'TMF620-COMPAT-422-RANGE-NOT-INTEGER', path: `${p}.${k}`, detail: r.error, hint: 'TMF620 v5 stores range limits as integers; put the unit in unitOfMeasure' });
      } else {
        cvs[k] = r.value;
      }
    });
  });
  return values;
}

function characteristicsToV5(list, path, ctx, out) {
  if (!Array.isArray(list)) return list;
  list.forEach((ch, i) => {
    if (!ch || typeof ch !== 'object') return;
    const p = `${path}[${i}]`;
    if (ch.productSpecCharacteristicValue !== undefined) {
      ch.characteristicValueSpecification = ch.productSpecCharacteristicValue;
      delete ch.productSpecCharacteristicValue;
    }
    if (ch.productSpecCharRelationship !== undefined) {
      ch.charSpecRelationship = ch.productSpecCharRelationship;
      delete ch.productSpecCharRelationship;
      (Array.isArray(ch.charSpecRelationship) ? ch.charSpecRelationship : []).forEach(rel => {
        if (!rel || typeof rel !== 'object') return;
        if (rel.id !== undefined) { rel.parentSpecificationId = rel.id; delete rel.id; }
        if (rel.href !== undefined) { rel.parentSpecificationHref = rel.href; delete rel.href; }
      });
    }
    if (ch.id === undefined) ch.id = ctx.newId();
    charValuesToV5(ch.characteristicValueSpecification, ch.valueType, `${p}.productSpecCharacteristicValue`, out);
  });
  return list;
}

function charValueUsesToV5(list, path, ctx, out) {
  if (!Array.isArray(list)) return list;
  list.forEach((use, i) => {
    if (!use || typeof use !== 'object') return;
    if (use.id === undefined) use.id = ctx.newId();
    charValuesToV5(use.productSpecCharacteristicValue, use.valueType, `${path}[${i}].productSpecCharacteristicValue`, out);
  });
  return list;
}

const ATTACHMENT_VALUE_KEYS = ['content', 'url', 'mimeType', 'attachmentType', 'size'];

function attachmentsToV5(list, path, out) {
  if (!Array.isArray(list)) return list;
  list.forEach((a, i) => {
    if (!a || typeof a !== 'object') return;
    if (a['@type'] === 'Attachment' || a['@type'] === 'AttachmentRef') return;
    const isValue = ATTACHMENT_VALUE_KEYS.some(k => a[k] !== undefined);
    if (isValue) a['@type'] = 'Attachment';
    else if (a.id !== undefined) a['@type'] = 'AttachmentRef';
    else out.problems.push({ code: 'TMF620-COMPAT-422-ATTACHMENT-AMBIGUOUS', path: `${path}[${i}]`, detail: 'has no id (for a reference) and none of content, url, mimeType, attachmentType or size (for a value)', hint: 'add an id to refer to an existing attachment, or url and mimeType to describe one' });
  });
  return list;
}

function priceRefsToV5(list) {
  if (!Array.isArray(list)) return list;
  list.forEach(p => { if (p && typeof p === 'object' && p['@type'] === undefined) p['@type'] = 'ProductOfferingPriceRef'; });
  return list;
}

function newIdFn(ctx) {
  return (ctx && ctx.idGenerator) || (() => crypto.randomUUID());
}

function toV5(resource, v4doc, ctx) {
  ctx = ctx || {};
  const info = resourceInfo(resource);
  const doc = clone(v4doc);
  const out = { problems: [], warnings: [] };
  const tctx = { newId: newIdFn(ctx) };

  // Root @type (matrix G1, G3)
  if (resource === 'catalog') {
    if (doc['@type'] === undefined || doc['@type'] === 'Catalog') {
      doc['@type'] = 'ProductCatalog';
      if (doc['@baseType'] === undefined) doc['@baseType'] = 'Catalog';
    }
  } else if (doc['@type'] === undefined) {
    doc['@type'] = info.v5Def;
  }

  if (doc.relatedParty !== undefined && hasRelatedParty(info)) doc.relatedParty = relatedPartyToV5(doc.relatedParty);

  if (resource === 'category' && doc.parentId !== undefined) {
    if (doc.parentId === null || doc.parentId === '') {
      doc.parent = doc.parentId;
    } else {
      doc.parent = { '@type': 'CategoryRef', id: doc.parentId, href: `/category/${doc.parentId}` };
    }
    delete doc.parentId;
  }

  if (resource === 'productSpecification') {
    characteristicsToV5(doc.productSpecCharacteristic, 'productSpecCharacteristic', tctx, out);
  }
  if (resource === 'productOffering' || resource === 'productOfferingPrice') {
    charValueUsesToV5(doc.prodSpecCharValueUse, 'prodSpecCharValueUse', tctx, out);
  }
  if (resource === 'productOffering' || resource === 'productSpecification') {
    attachmentsToV5(doc.attachment, 'attachment', out);
  }
  if (resource === 'productOffering') priceRefsToV5(doc.productOfferingPrice);

  walk(doc, info.v5Def, info.v4Def, 'toV5', '', out);

  mapHrefs(doc, h => normaliseHref(h, ctx.componentName));
  if (doc.id !== undefined && doc.id !== null) doc.href = `/${resource}/${doc.id}`;

  return { doc, problems: out.problems, warnings: out.warnings };
}

// ---------------------------------------------------------------------------
// v5 -> v4

function stripInternal(doc) {
  Object.keys(doc).forEach(k => { if (k.charAt(0) === '_') delete doc[k]; });
  return doc;
}

function relatedPartyToV4(list, out) {
  if (!Array.isArray(list)) return list;
  return list.map((rp, i) => {
    if (!rp || typeof rp !== 'object' || !rp.partyOrPartyRole) return rp;
    const ref = rp.partyOrPartyRole;
    const flat = {};
    ['id', 'href', 'name', '@schemaLocation', '@baseType'].forEach(k => { if (ref[k] !== undefined) flat[k] = ref[k]; });
    if (rp.role !== undefined) flat.role = rp.role;
    flat['@referredType'] = ref['@referredType'] || (typeof ref['@type'] === 'string' ? ref['@type'].replace(/Ref$/, '') : 'Party');
    ['partyId', 'partyName'].forEach(k => {
      if (ref[k] !== undefined) out.warnings.push({ code: 'W-PARTYROLE', path: `relatedParty[${i}].partyOrPartyRole.${k}` });
    });
    return flat;
  });
}

function embeddedPricesToV4(list, out) {
  if (!Array.isArray(list)) return list;
  const kept = [];
  list.forEach((p, i) => {
    if (!p || typeof p !== 'object' || p['@type'] !== 'ProductOfferingPrice') { kept.push(p); return; }
    if (p.id !== undefined) {
      const ref = { '@type': 'ProductOfferingPriceRef', id: p.id };
      if (p.href !== undefined) ref.href = p.href;
      if (p.name !== undefined) ref.name = p.name;
      kept.push(ref);
      out.warnings.push({ code: 'W-EMBEDDED-POP', path: `productOfferingPrice[${i}]`, detail: 'embedded price shown as a reference' });
    } else {
      out.warnings.push({ code: 'W-EMBEDDED-POP', path: `productOfferingPrice[${i}]`, detail: 'embedded price without id left out' });
      out.omitted.push('productOfferingPrice');
    }
  });
  return kept;
}

function charValuesToV4(values) {
  if (!Array.isArray(values)) return values;
  values.forEach(cvs => {
    if (!cvs || typeof cvs !== 'object') return;
    ['valueFrom', 'valueTo'].forEach(k => { if (typeof cvs[k] === 'number') cvs[k] = String(cvs[k]); });
  });
  return values;
}

function characteristicsToV4(list) {
  if (!Array.isArray(list)) return list;
  list.forEach(ch => {
    if (!ch || typeof ch !== 'object') return;
    if (ch.characteristicValueSpecification !== undefined) {
      ch.productSpecCharacteristicValue = charValuesToV4(ch.characteristicValueSpecification);
      delete ch.characteristicValueSpecification;
    }
    if (ch.charSpecRelationship !== undefined) {
      ch.productSpecCharRelationship = ch.charSpecRelationship;
      delete ch.charSpecRelationship;
      (Array.isArray(ch.productSpecCharRelationship) ? ch.productSpecCharRelationship : []).forEach(rel => {
        if (!rel || typeof rel !== 'object') return;
        if (rel.parentSpecificationId !== undefined) { rel.id = rel.parentSpecificationId; delete rel.parentSpecificationId; }
        if (rel.parentSpecificationHref !== undefined) { rel.href = rel.parentSpecificationHref; delete rel.parentSpecificationHref; }
      });
    }
  });
  return list;
}

function v4BaseUrl(ctx) {
  if (ctx.v4BaseUrl) return ctx.v4BaseUrl;
  return `/${ctx.componentName || 'r1-productcatalogmanagement'}/tmf-api/productCatalogManagement/v4`;
}

function toV4(resource, v5doc, ctx) {
  ctx = ctx || {};
  const info = resourceInfo(resource);
  const doc = stripInternal(clone(v5doc));
  const out = { warnings: [], omitted: [] };

  if (resource === 'productOffering' && doc.productOfferingPrice !== undefined) {
    doc.productOfferingPrice = embeddedPricesToV4(doc.productOfferingPrice, out);
  }

  walk(doc, info.v5Def, info.v4Def, 'toV4', '', out);

  if (doc.relatedParty !== undefined && hasRelatedParty(info)) doc.relatedParty = relatedPartyToV4(doc.relatedParty, out);

  if (resource === 'category' && doc.parent !== undefined) {
    if (doc.parent && typeof doc.parent === 'object') {
      Object.keys(doc.parent).forEach(k => {
        if (['id', 'href', '@type', '@baseType', '@schemaLocation', '@referredType'].indexOf(k) < 0) {
          out.warnings.push({ code: 'W-V5ONLY-ATTR', path: `parentId.${k}`, detail: 'TMF620 v4 refers to the parent category by id only' });
        }
      });
    }
    doc.parentId = doc.parent && typeof doc.parent === 'object' ? doc.parent.id : doc.parent;
    delete doc.parent;
  }
  if (resource === 'productSpecification') characteristicsToV4(doc.productSpecCharacteristic);
  if (resource === 'productOffering' || resource === 'productOfferingPrice') {
    (Array.isArray(doc.prodSpecCharValueUse) ? doc.prodSpecCharValueUse : []).forEach(u => charValuesToV4(u && u.productSpecCharacteristicValue));
  }
  if (resource === 'catalog') {
    if (doc['@type'] === 'ProductCatalog') doc['@type'] = 'Catalog';
    if (doc['@baseType'] === 'Catalog') delete doc['@baseType'];
  }

  const base = v4BaseUrl(ctx);
  mapHrefs(doc, h => buildHref(h, 'v4', base));

  return { doc, warnings: out.warnings, omitted: Array.from(new Set(out.omitted)) };
}

module.exports = { toV5, toV4, walk };
