'use strict';

const https = require('https');
const axios = require('axios');

const {validationRules, validationRulesType2} = require('../utils/rules');
const {TError, TErrorEnum} = require('../utils/errorUtils');
const {getPayloadType} = require('../utils/swaggerUtils');

const validateRequest = function(req, operationId, doc) {
  return new Promise(function(resolve, reject) {
    const resourceType = getPayloadType(req);
    const method = req.method.toUpperCase();

    if (validationRulesType2[resourceType] !== undefined) {
      const rule = validationRulesType2[resourceType][method];
      if (rule) {
        const error = processRules(rule, doc);
        if (error.length > 0) {
          var errString = error.join('\n').replace(/"/g, '');
          return reject(new TError(TErrorEnum.INVALID_BODY, errString));
        }
        return resolve(doc);
      }
    }

    const rule = validationRules[operationId];
    if (rule) {
      const error = processRules(rule, doc);
      if (error.length > 0) {
        var errString = error.join('\n').replace(/"/g, '');
        return reject(new TError(TErrorEnum.INVALID_BODY, errString));
      }
    }

    resolve(doc);
  });
};

function processRules(rules, obj) {
  var error = [];
  if (Array.isArray(rules)) {
    rules.forEach(rule => {
      const path = Object.keys(rule)[0];
      const err = processRule(rule, obj, path);
      error = error.concat(err);
    });
  }
  return error;
}

function processRule(rule, obj, path, lastLabel) {
  var error = [];
  lastLabel = lastLabel || '';

  if (Array.isArray(obj) && obj.length > 0) {
    obj.forEach(item => {
      const err = processRule(rule, item, path, lastLabel);
      error = error.concat(err);
    });
    return error;
  }

  var label = Object.keys(rule)[0];
  var parts = split2s(label, '.');
  var criteria = rule[label];

  if (label.substring(0, 1) === '$' && Array.isArray(criteria) && criteria.length > 0) {
    criteria.forEach(item => {
      const err = processRule({ $: item }, obj, path, lastLabel);
      error = error.concat(err);
    });
    return error;
  }

  if (label === '$') {
    const criteriaType = Object.keys(criteria)[0];
    switch (criteriaType) {
      case '$eitherOf': return checkEitherOf(criteria, obj, path, lastLabel);
      case '$present':  return checkPresent(criteria, obj, path, lastLabel);
      case '$notEmpty': return checkNotEmpty(criteria, obj, path, lastLabel);
      case '$presentIf': return checkPresentIf(criteria, obj, path, lastLabel);
      case '$notEqual': return checkNotEqual(criteria, obj, path, lastLabel);
      default: return error;
    }
  } else if (obj.hasOwnProperty(parts[0])) {
    if (parts.length == 1) {
      var nextObj = (typeof obj[parts[0]] == 'object') ? obj[parts[0]] : obj;
      return processRule({ $: criteria }, nextObj, path, parts[0]);
    } else {
      var subrule = {};
      subrule[parts[1]] = criteria;
      return processRule(subrule, obj[parts[0]], path, parts[0]);
    }
  }
  return error;
}

function checkNotEmpty(criteria, obj, path, lastLabel) {
  var error = [];
  if (criteria.$notEmpty && Array.isArray(obj) && obj.length == 0) {
    error.push(path + ':' + JSON.stringify(criteria));
  }
  return error;
}

function checkEitherOf(criteria, obj, path, lastLabel) {
  var error = [];
  if (criteria.$eitherOf) {
    var failure = true;
    criteria.$eitherOf.forEach(item => { if (hasProperty(obj, item)) failure = false; });
    if (failure) error.push(path + ':' + JSON.stringify(criteria));
  }
  return error;
}

function checkPresent(criteria, obj, path, lastLabel) {
  var error = [];
  if (criteria.$present) {
    var failure = false;
    criteria.$present.forEach(item => { if (!hasProperty(obj, item)) failure = true; });
    if (failure) error.push(path + ':' + JSON.stringify(criteria));
  }
  return error;
}

function checkPresentIf(criteria, obj, path, lastLabel) {
  var error = [];
  if (criteria.$presentIf && !hasProperty(obj, criteria.$presentIf)) {
    error.push(path + ':' + JSON.stringify(criteria));
  }
  return error;
}

function checkNotEqual(criteria, obj, path, lastLabel) {
  var error = [];
  if (criteria.$notEqual && (obj[lastLabel] !== criteria.$notEqual)) {
    var subrule = JSON.parse(JSON.stringify(criteria));
    delete subrule.$notEqual;
    const err = processRule({ $: subrule }, obj, path, lastLabel);
    if (err.length > 0) error.push(path + ':' + JSON.stringify(criteria));
  }
  return error;
}

function split2s(str, delim) {
  var p = str.indexOf(delim);
  if (p !== -1) {
    return [str.substring(0, p), str.substring(p + 1)];
  }
  return [str];
}

function hasProperty(obj, path) {
  var arr = path.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  return (obj !== undefined);
}

// Validates permission.user.href against TMF632.
// Skips validation if user or user.href is absent.
async function validateUserHref(payload) {
  const href = payload?.user?.href;
  if (!href) return payload;
  try {
    await axios.get(href, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 3000
    });
  } catch (err) {
    if (err?.code !== undefined && err?.reason !== undefined) throw err;
    throw new TError(TErrorEnum.UNPROCESSABLE_ENTITY, `Could not resolve user.href: ${href}`);
  }
  return payload;
}

module.exports = { validateRequest, validateUserHref };
