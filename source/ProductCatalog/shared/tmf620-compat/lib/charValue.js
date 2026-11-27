'use strict';

// Characteristic value specifications (matrix S2, S3, S5). In v5 the @type of a
// value picks a subtype that fixes the type of `value`; v4 has a free `value` and an
// optional `valueType`. Used by the v4 translator and by the v5 service's own check
// (the OAS validator does not check `value` against the subtype).

const { shapes, extendsSchema } = require('./model');

const BASE = 'CharacteristicValueSpecification';

// valueType (lower case) -> subtype stem (matrix S2)
const VALUE_TYPE_STEMS = {
  string: 'String', text: 'String',
  integer: 'Integer', int: 'Integer',
  number: 'Number', decimal: 'Number', double: 'Number', float: 'Number',
  boolean: 'Boolean', bool: 'Boolean',
  object: 'Object',
  map: 'Map'
};

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function fitsStem(stem, v) {
  switch (stem) {
    case 'String': return typeof v === 'string';
    case 'Integer': return Number.isInteger(v);
    case 'Number':
    case 'Float': return typeof v === 'number' && isFinite(v);
    case 'Boolean': return typeof v === 'boolean';
    case 'Object':
    case 'Map': return isPlainObject(v);
    default: return false;
  }
}

function stemOfJson(v) {
  if (typeof v === 'string') return 'String';
  if (typeof v === 'boolean') return 'Boolean';
  if (Number.isInteger(v)) return 'Integer';
  if (typeof v === 'number') return 'Number';
  if (isPlainObject(v)) return 'Object';
  return undefined;
}

function typeName(stem, isArray) {
  return `${stem}${isArray ? 'Array' : ''}${BASE}`;
}

// The stem and array-ness of a known v5 subtype name, or undefined.
function parseSubtype(name) {
  if (typeof name !== 'string' || !extendsSchema(name, BASE)) return undefined;
  const m = /^(String|Integer|Number|Float|Boolean|Object|Map)(Array)?CharacteristicValueSpecification$/.exec(name);
  return m ? { stem: m[1], isArray: !!m[2] } : undefined;
}

function fits(stem, isArray, value) {
  if (isArray) return Array.isArray(value) && value.every(v => fitsStem(stem, v));
  return !Array.isArray(value) && fitsStem(stem, value);
}

function describeValue(v) {
  return JSON.stringify(v).slice(0, 80);
}

// For a v4 value: decides the v5 @type. Returns {type, replaced?} or {error}.
//   cvs: the value object; parentValueType: the characteristic's valueType
function inferV5Type(cvs, parentValueType) {
  const declared = cvs['@type'];
  const hasValue = cvs.value !== undefined;
  const value = cvs.value;

  // A v4 client may already use a v5 subtype name
  const sub = parseSubtype(declared);
  if (sub) {
    if (hasValue && !fits(sub.stem, sub.isArray, value)) {
      return { error: `value ${describeValue(value)} does not fit @type ${declared}` };
    }
    return { type: declared };
  }

  const valueType = (cvs.valueType || parentValueType || '').toString().toLowerCase();
  const declaredStem = VALUE_TYPE_STEMS[valueType];
  if (valueType && !declaredStem) {
    if (!hasValue) return { type: BASE, replaced: declared && declared !== BASE ? declared : undefined };
    // Unknown valueType word: fall back to the JSON type of the value
  }

  let type;
  if (!hasValue) {
    type = declaredStem ? typeName(declaredStem, false) : BASE;
  } else if (Array.isArray(value)) {
    const stems = Array.from(new Set(value.map(stemOfJson)));
    let stem = declaredStem;
    if (stem) {
      if (!value.every(v => fitsStem(stem, v))) {
        return { error: `value ${describeValue(value)} is not an array of ${valueType}` };
      }
    } else {
      stem = stems.length === 1 && stems[0] ? stems[0] : 'Object';
      if (stems.length !== 1 && !value.every(isPlainObject)) {
        return { error: `value ${describeValue(value)} mixes types; TMF620 v5 arrays hold one type` };
      }
    }
    type = typeName(stem, true);
  } else if (declaredStem) {
    if (!fitsStem(declaredStem, value)) {
      return { error: `value ${describeValue(value)} is not ${/^[aeiou]/i.test(valueType) ? "an" : "a"} ${valueType}` };
    }
    type = typeName(declaredStem, false);
  } else {
    const stem = stemOfJson(value);
    if (!stem) return { error: `value ${describeValue(value)} has no TMF620 v5 characteristic value type` };
    type = typeName(stem, false);
  }
  const replaced = declared && declared !== type ? declared : undefined;
  return replaced ? { type, replaced } : { type };
}

// v4 valueFrom/valueTo (strings) -> v5 integers (matrix S3). Returns {value} or {error}.
function toIntegerRange(v) {
  if (v === undefined || v === null) return { value: v };
  if (Number.isInteger(v)) return { value: v };
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return { value: parseInt(v.trim(), 10) };
  return { error: `${describeValue(v)} is not an integer` };
}

// For the v5 service: checks a v5 value object. Returns an error string or undefined.
function checkV5Value(cvs) {
  const declared = cvs['@type'];
  if (declared === BASE) return undefined;
  const sub = parseSubtype(declared);
  if (!sub) {
    if (shapes.v5[declared]) return `@type ${declared} is not a characteristic value specification`;
    return `@type ${declared} is not a TMF620 v5 characteristic value specification subtype`;
  }
  if (cvs.value !== undefined && !fits(sub.stem, sub.isArray, cvs.value)) {
    return `value ${describeValue(cvs.value)} does not fit @type ${declared}`;
  }
  return undefined;
}

function allowedSubtypes() {
  return Object.keys(shapes.v5).filter(n => extendsSchema(n, BASE));
}

module.exports = { inferV5Type, toIntegerRange, checkV5Value, allowedSubtypes, parseSubtype, BASE };
