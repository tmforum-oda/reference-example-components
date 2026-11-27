'use strict';

// The five resources, their schema names and path segments in each version, and
// lookups into the generated shapes. Runs on Node 16 (the v4 service image).

const shapes = require('../generated/shapes.json');

const RESOURCES = {
  catalog: { v4Def: 'Catalog', v5Def: 'ProductCatalog', v4Segment: 'catalog', v5Segment: 'productCatalog' },
  category: { v4Def: 'Category', v5Def: 'Category', v4Segment: 'category', v5Segment: 'category' },
  productOffering: { v4Def: 'ProductOffering', v5Def: 'ProductOffering', v4Segment: 'productOffering', v5Segment: 'productOffering' },
  productOfferingPrice: { v4Def: 'ProductOfferingPrice', v5Def: 'ProductOfferingPrice', v4Segment: 'productOfferingPrice', v5Segment: 'productOfferingPrice' },
  productSpecification: { v4Def: 'ProductSpecification', v5Def: 'ProductSpecification', v4Segment: 'productSpecification', v5Segment: 'productSpecification' }
};

// v5 property name -> v4 property name, per v5 schema (matrix S1, S4).
const RENAMES_V5_TO_V4 = {
  CharacteristicSpecification: {
    characteristicValueSpecification: 'productSpecCharacteristicValue',
    charSpecRelationship: 'productSpecCharRelationship'
  },
  CharacteristicSpecificationRelationship: {
    parentSpecificationId: 'id',
    parentSpecificationHref: 'href'
  }
};

// v5 schema at the same position as each v4 schema, where the names differ.
const V4_DEF_FOR_V5 = {
  ProductCatalog: 'Catalog',
  CharacteristicSpecification: 'ProductSpecificationCharacteristic',
  CharacteristicSpecificationRelationship: 'ProductSpecificationCharacteristicRelationship',
  CharacteristicValueSpecification: 'ProductSpecificationCharacteristicValue',
  AttachmentRefOrValue: 'AttachmentRefOrValue',
  Attachment: 'AttachmentRefOrValue',
  AttachmentRef: 'AttachmentRefOrValue',
  ProductOfferingPriceRefOrValue: 'ProductOfferingPriceRef',
  ProductOfferingPriceRef: 'ProductOfferingPriceRef'
};

function v4Shape(name) { return name ? shapes.v4[name] : undefined; }
function v5Shape(name) { return name ? shapes.v5[name] : undefined; }

function extendsSchema(name, base) {
  const s = shapes.v5[name];
  return !!s && Array.isArray(s.extends) && s.extends.indexOf(base) >= 0;
}

function isExtensible(name) {
  return name === 'Extensible' || extendsSchema(name, 'Extensible');
}

// Picks the concrete v5 schema for an object at a position typed `name`: the subtype
// named by @type when it is one (discriminator or oneOf), otherwise `name`.
function resolveV5(name, obj) {
  const s = shapes.v5[name];
  if (!s || !obj || typeof obj !== 'object') return name;
  const t = obj['@type'];
  if (s.oneOf) {
    if (t && s.oneOf.indexOf(t) >= 0) return t;
    return name;
  }
  if (t && t !== name && extendsSchema(t, name)) return t;
  return name;
}

// The v4 schema at the same position as a v5 schema (for subtypes, the v4 schema of the base).
function v4DefFor(v5Name, v4Hint) {
  if (v4Hint) return v4Hint;
  if (V4_DEF_FOR_V5[v5Name]) return V4_DEF_FOR_V5[v5Name];
  if (extendsSchema(v5Name, 'CharacteristicValueSpecification')) return 'ProductSpecificationCharacteristicValue';
  return shapes.v4[v5Name] ? v5Name : undefined;
}

// Properties of a v5 schema; for a oneOf, the union of its members' properties.
function v5Props(name) {
  const s = shapes.v5[name];
  if (!s) return {};
  if (s.oneOf) return Object.assign({}, ...s.oneOf.map(m => (shapes.v5[m] ? shapes.v5[m].props : {})));
  return s.props;
}

function v4PropName(v5Name, prop) {
  const r = RENAMES_V5_TO_V4[v5Name];
  return (r && r[prop]) || prop;
}

function v5PropName(v5Name, v4prop) {
  const r = RENAMES_V5_TO_V4[v5Name] || {};
  for (const k of Object.keys(r)) if (r[k] === v4prop) return k;
  return v4prop;
}

function clone(obj) {
  return obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
}

module.exports = {
  shapes, RESOURCES, RENAMES_V5_TO_V4,
  v4Shape, v5Shape, v5Props, resolveV5, v4DefFor, isExtensible, extendsSchema,
  v4PropName, v5PropName, clone
};
