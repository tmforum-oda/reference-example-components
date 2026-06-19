'use strict';

const uuid = require('uuid');
const swaggerUtils = require('../utils/swaggerUtils');
const logger = require('../logger');
const config = require('../config');
const { TError, TErrorEnum } = require('../utils/errorUtils');

//
// Sets mandatory response attributes (id, href, creationDate, lastUpdate, @type, @baseType, @schemaLocation).
// Must be called in the create chain for every resource. Reads schema from openapi.yaml components.schemas.
//
async function processCommonAttributes(type, obj, req) {
  return new Promise(function(resolve, reject) {
    var typedef = swaggerUtils.getTypeDefinition(type);
    const required = typedef?.required;
    typedef = typedef?.properties || typedef;

    if (!typedef) return resolve(obj);
    if (Array.isArray(obj)) return resolve(obj);
    if (!type) return resolve(obj);

    if (typedef.id && !obj.id) {
      if (typedef.id?.type === 'integer') {
        obj.id = Math.floor(Math.random() * 1000000000000);
      } else {
        obj.id = uuid.v4();
      }
    }

    if (req?.url && typedef.href && !obj.href) {
      const self = req.url.replace(/\/$/, '') + '/' + obj.id;
      if (!self.startsWith('http') && req?.headers?.host) {
        obj.href = swaggerUtils.getURLScheme() + '://' + req.headers.host + self;
      } else {
        obj.href = self;
      }
    }

    if (typedef.creationDate && !obj.creationDate) {
      obj.creationDate = new Date();
    }

    if (typedef.lastUpdate) {
      obj.lastUpdate = new Date();
    }

    if (typedef['@schemaLocation'] && !obj['@schemaLocation']) {
      const ref = swaggerUtils.getTypePath(type);
      if (ref) {
        const url = (config.SCHEMA_URL || '') + '#/' + ref;
        obj['@schemaLocation'] = encodeURI(url);
      }
    }

    if (typedef['@type'] && !obj['@type']) {
      obj['@type'] = type;
    }

    if (typedef['@baseType'] && !obj['@baseType']) {
      obj['@baseType'] = type;
    }

    return resolve(obj);
  });
}

//
// Fills in missing required properties with generated sample values.
// Called after processCommonAttributes to ensure the response has all required fields.
//
async function processMissingProperties(type, obj, req) {
  return new Promise(function(resolve, reject) {
    var typedef = swaggerUtils.getTypeDefinition(type);
    const required = typedef?.required;
    typedef = typedef?.properties || typedef;

    if (!typedef) return resolve(obj);
    if (Array.isArray(obj)) return resolve(obj);
    if (!type) return resolve(obj);

    required?.forEach(prop => {
      if (!obj[prop]) {
        const sampleValue = generateSampleValue(type, prop);
        if (sampleValue) obj[prop] = sampleValue;
      }
    });

    return resolve(obj);
  });
}

//
// Adds server-side-only fields that are excluded from the POST (FVO) type but present in the full type.
// Handles the delta between {Type}_Create and the full {Type} schema.
//
async function processExcludedInPost(type, obj, req) {
  return new Promise(function(resolve, reject) {
    const createType = type + '_Create';
    var typedefCreate = swaggerUtils.getTypeDefinition(createType);

    if (!typedefCreate) return resolve(obj);

    var typedef = swaggerUtils.getTypeDefinition(type);
    typedef = typedef?.properties || typedef;
    typedefCreate = typedefCreate?.properties || typedefCreate;

    if (!typedef || !typedefCreate) return resolve(obj);

    const typeKeys = Object.keys(typedef);
    const typeCreateKeys = Object.keys(typedefCreate);
    const deltaKeys = typeKeys.filter(prop => !typeCreateKeys.includes(prop));

    deltaKeys?.forEach(prop => {
      if (!obj[prop]) {
        const sampleValue = generateSampleValue(type, prop);
        if (sampleValue) obj[prop] = sampleValue;
      }
    });

    return resolve(obj);
  });
}

//
// Converts date-time string fields to native Date objects before DB insert.
// MongoDB stores these as native BSON dates for proper date-range querying.
//
async function replaceWithJavascriptTypes(type, obj, req) {
  return new Promise(function(resolve, reject) {
    try {
      let typeDefinition = swaggerUtils.getTypeDefinition(type);
      typeDefinition = typeDefinition?.properties || typeDefinition;
      return resolve(replaceWithNativeTypes(typeDefinition, obj));
    } catch (error) {
      logger.info('replaceWithJavascriptTypes: error=' + error);
      return resolve(obj);
    }
  });
}

function replaceWithNativeTypes(typeDefinition, obj) {
  if (!typeDefinition) return obj;

  if (typeDefinition?.['$ref']) {
    typeDefinition = swaggerUtils.getTypeDefinitionByRef(typeDefinition['$ref']);
    typeDefinition = typeDefinition?.properties || typeDefinition;
  }

  if (Array.isArray(obj)) {
    const arrayDefinitions = typeDefinition?.items || typeDefinition;
    obj = obj.map(o => replaceWithNativeTypes(arrayDefinitions, o));
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(prop => {
      const definition = typeDefinition?.[prop];
      const format = definition?.format;
      if (format === 'date-time') {
        obj[prop] = new Date(obj[prop]);
      }
      if (typeof obj[prop] === 'object') {
        obj[prop] = replaceWithNativeTypes(typeDefinition[prop], obj[prop]);
      }
    });
  }
  return obj;
}

function generateSampleValue(type, property) {
  const typedef = swaggerUtils.getTypeDefinition(type);
  const typeOfProp = typedef?.properties?.[property];
  if (!typeOfProp) return undefined;

  try {
    return generateSampleValueForType(type, typeOfProp, 'sample of ' + property);
  } catch (error) {
    return undefined;
  }
}

function generateSampleValueForType(type, typedef, candidateDefault) {
  if (!typedef) return undefined;

  if (typedef.format === 'date-time') {
    return new Date(Date.now() + Math.floor(Math.random() * 10000000));
  }

  if (typedef.enum) {
    return typedef.enum[0];
  }

  if (typedef['$ref']) {
    const ref = typedef['$ref'].split('/').splice(-1)[0];
    const typeOfRef = swaggerUtils.getTypeDefinition(ref);
    return generateSampleValueForType(ref, typeOfRef);
  }

  if (typedef.type === 'string') {
    return candidateDefault || 'samplevalue';
  }

  if (typedef.type === 'boolean') {
    return false;
  }

  if (typedef.properties) {
    const res = {};
    Object.keys(typedef.properties).forEach(prop => {
      const sampleValue = generateSampleValue(type, prop);
      if (sampleValue) res[prop] = sampleValue;
    });
    return res;
  }
}

module.exports = {
  processCommonAttributes,
  processMissingProperties,
  processExcludedInPost,
  replaceWithJavascriptTypes,
  generateSampleValue
};
