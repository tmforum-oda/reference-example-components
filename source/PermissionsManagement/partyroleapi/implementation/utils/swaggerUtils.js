'use strict';

const fs = require('fs');
const jsyaml = require('js-yaml');
const config = require('../config');
const logger = require('../logger');
const { TError, TErrorEnum } = require('../utils/errorUtils');

var spec;
var swaggerDoc;

function getSwaggerDoc() {
  if (!swaggerDoc) {
    spec = fs.readFileSync(config.OPENAPI_YAML, 'utf8');
    let api = jsyaml.load(spec);
    swaggerDoc = expandAllOfs(api, api);
  }
  return swaggerDoc;
}

function reloadAPI() {
  swaggerDoc = undefined;
}

function getServerAndBasePath() {
  const doc = getSwaggerDoc();
  let path = doc?.servers?.[0]?.url || config.EXTERNAL_URL || 'http://server:port/basepath';
  if (!path.endsWith('/')) path = path + '/';
  return path;
}

function getBasePath() {
  const url = new URL(getServerAndBasePath());
  return url.pathname;
}

function getTypeDefinition(type) {
  const meta = getSwaggerDoc();
  return meta?.components?.schemas?.[type];
}

function getTypeDefinitionByRef(ref) {
  const type = ref.split('/').splice(-1)[0];
  return getTypeDefinition(type);
}

function getTypePath(type) {
  try {
    const meta = getSwaggerDoc();
    if (meta.components.schemas[type]) {
      return 'components.schemas.' + type;
    }
  } catch (e) {}
  return undefined;
}

function getTypeOfProperty(type, property) {
  let typeDefinition = getTypeDefinition(type);
  const parts = property.split('.');
  for (const argument of parts) {
    typeDefinition = typeDefinition?.properties?.[argument] || typeDefinition?.[argument];
    if (!typeDefinition) break;
  }
  return typeDefinition;
}

function getURLScheme() {
  return 'http';
}

function getHostPath(context) {
  return config?.EXTERNAL_URL || 'http://localhost';
}

function getResponseTypeFromUrl(url) {
  const path = url.split('?')[0];
  return getResponseTypeByPath(path);
}

function getResponseTypeByPath(path) {
  var type;
  const swaggerDoc = getSwaggerDoc();
  const paths = Object.keys(swaggerDoc.paths);
  const candidates = paths.filter(p => path.endsWith(p));

  if (candidates.length == 1) {
    var p = swaggerDoc.paths[candidates[0]];

    p = p?.post?.responses?.['201'] || p?.post?.responses?.['200'] || p?.get?.responses?.['200'];
    p = p?.content?.['application/json'] || p?.content?.['application/json;charset=utf-8'] || p;

    type = p?.schema?.items?.$ref || p?.schema?.$ref;
    type = type?.split('/').slice(-1)[0] || type;
  }
  return type;
}

function cleanPayloadServiceType(payload, type, args) {
  try {
    if (payload.constructor === Array) {
      payload.forEach(v => {
        delete v._serviceType;
        delete v._id;
      });
    } else {
      delete payload._serviceType;
      delete payload._id;
    }
  } catch (e) {
    logger.error('cleanPayloadServiceType error=' + e);
  }

  const fields = args?.fields?.split(',');
  if (fields === 'none' || fields?.includes('none')) {
    const typedef = getTypeDefinition(type);
    const required = typedef?.required || [];
    const keep = [...required, ...(config?.DEFAULT_FILTERING_FIELDS_KEYS || ['id', 'href', '@type'])];
    if (Array.isArray(payload)) {
      payload.forEach(item => {
        Object.keys(item).forEach(key => { if (!keep.includes(key)) delete item[key]; });
      });
    } else {
      Object.keys(payload).forEach(key => { if (!keep.includes(key)) delete payload[key]; });
    }
  }

  return payload;
}

//
// expandAllOfs flattens allOf inheritance in the OpenAPI spec at load time so that
// getTypeDefinition returns a fully merged schema with all inherited properties.
//
const processedReplaceAllRefs = {};
const processingReplaceAllRefs = {};

function expandAllOfs(api, doc) {
  var res = doc;
  if (!doc) return doc;
  try {
    if (doc.allOf) {
      res = [];
      doc.allOf?.forEach(x => {
        if (x['$ref']) {
          const ref    = x['$ref'];
          const entity = ref.split('/').splice(-1)[0];

          if (!processingReplaceAllRefs[entity]) {
            processingReplaceAllRefs[entity] = true;
            const tmp = processedReplaceAllRefs[entity] || expandAllOfs(api, getValueByPath(api, ref));
            processedReplaceAllRefs[entity] = tmp;
            res.push(expandAllOfs(api, tmp));
            processingReplaceAllRefs[entity] = false;
          } else {
            res.push(x);
          }
        } else {
          res.push(expandAllOfs(api, x));
        }
      });

      res = mergeArray(res);
      delete doc.allOf;
      res = mergeObjects(doc, res);
    }

    if (Array.isArray(res)) {
      res = res.map(x => expandAllOfs(api, x));
    } else if (typeof res === 'object') {
      res = Object.fromEntries(Object.entries(res).map(([key, val]) => [key, expandAllOfs(api, val)]));
    }
  } catch (error) {
    logger.info('expandAllOfs:: error=' + error);
  }
  return res;
}

function mergeArray(array) {
  let res = {};
  array.forEach(element => { mergeObjects(res, element); });
  return res;
}

function mergeObjects(target, delta) {
  Object.keys(delta).forEach(key => {
    if (!target?.[key]) {
      target[key] = delta[key];
    } else if (Array.isArray(delta[key]) && Array.isArray(target[key])) {
      target[key] = target[key].concat(delta[key]);
    } else if (typeof delta[key] === 'object') {
      target[key] = mergeObjects(target[key], delta[key]);
    }
  });
  return target;
}

function getValueByPath(api, path) {
  let res = api;
  let parts = path.replace('#/', '').split('/');
  parts.forEach(part => { res = res?.[part]; });
  return res;
}

module.exports = {
  getSwaggerDoc,
  getTypeDefinition,
  getTypeDefinitionByRef,
  getTypePath,
  getTypeOfProperty,
  getResponseTypeFromUrl,
  getResponseTypeByPath,
  getURLScheme,
  getHostPath,
  getServerAndBasePath,
  getBasePath,
  cleanPayloadServiceType,
  reloadAPI
};
