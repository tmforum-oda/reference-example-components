'use strict';

const https = require('https');
const axios = require('axios');
const {validationRules, validationRulesType2} = require('../utils/rules');
const {TError, TErrorEnum} = require('../utils/errorUtils');
const {getPayloadType} = require('../utils/swaggerUtils');

function validateRequest(req, operation, doc) {
  return new Promise(function(resolve, reject) {
    var payloadType = getPayloadType(req);
    if(payloadType!==null) {
      if(payloadType.startsWith("TMF")) {
        payloadType = payloadType.substring(6);
      }
      console.log(operation + ' :: validate request :: payloadType=' + payloadType);
      const op = req.method.toUpperCase();
      if(validationRulesType2[payloadType]!==undefined) {
        const rule = validationRulesType2[payloadType][op];
        if(rule) {
          console.log(operation + ' :: validate request :: validationRulesType2 found');
          const error = processRules(rule, doc);
          if(error.length>0) {
            var errString = error.join("\n").replace(/"/g, "");
            return reject(new TError(TErrorEnum.INVALID_BODY, errString));
          } else {
            return resolve(doc);
          }
        } else {
          console.log(operation + ' :: validationRulesType2 does not include ' + op);
        }
      } else {
        console.log(operation + ' :: validationRulesType2 does not include ' + payloadType);
      }
    }
    const rule = validationRules[operation];
    if(rule) {
      const error = processRules(rule, doc);
      if(error.length>0) {
        var errString = error.join("\n").replace(/"/g, "");
        return reject(new TError(TErrorEnum.INVALID_BODY, errString));
      } else {
        return resolve(doc);
      }
    }
    resolve(doc);
  });
}

// Validates category[*].href against TMF620 Product Catalog (mandatory dependent API)
async function validateCategoryHref(payload) {
  const items = payload?.category;
  if (!items || !Array.isArray(items)) return payload;
  for (const item of items) {
    const href = item?.href;
    if (!href) continue;
    let parsedUrl;
    try {
      parsedUrl = new URL(href);
    } catch (e) {
      throw new TError(TErrorEnum.UNPROCESSABLE_ENTITY, `Could not resolve category.href: ${href}`);
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new TError(TErrorEnum.UNPROCESSABLE_ENTITY, `Could not resolve category.href: ${href}`);
    }
    try {
      await axios.get(href, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 3000
      });
    } catch (err) {
      if (err?.code !== undefined && err?.reason !== undefined) throw err;
      throw new TError(TErrorEnum.UNPROCESSABLE_ENTITY, `Could not resolve category.href: ${href}`);
    }
  }
  return payload;
}

function processRules(rules, obj) {
  var error = [];
  if(Array.isArray(rules)) {
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
  lastLabel = lastLabel || "";
  if(Array.isArray(obj) && obj.length>0) {
    obj.forEach(item => { error = error.concat(processRule(rule, item, path, lastLabel)); });
    return error;
  }
  var label = Object.keys(rule)[0];
  var parts = split2s(label, ".");
  var criteria = rule[label];
  if(label.substring(0,1)==='$' && Array.isArray(criteria) && criteria.length>0) {
    criteria.forEach(item => { error = error.concat(processRule({$: item}, obj, path, lastLabel)); });
    return error;
  }
  if(label === '$') {
    const criteriaType = Object.keys(criteria)[0];
    switch(criteriaType) {
      case "$notEqual": return checkNotEqual(criteria, obj, path, lastLabel);
      case "$equal":    return checkEqual(criteria, obj, path, lastLabel);
      case "$present":  return checkPresent(criteria, obj, path, lastLabel);
      case "$eitherOf": return checkEitherOf(criteria, obj, path, lastLabel);
      case "$notEmpty": return checkNotEmpty(criteria, obj, path, lastLabel);
      case "$presentIf":return checkPresentIf(criteria, obj, path, lastLabel);
      case "$and":      return checkAndRule(criteria, obj, path, lastLabel);
      case "$in":       return checkInRule(criteria, obj, path, lastLabel);
      case "$noneOf":   return checkNoneOf(criteria, obj, path, lastLabel);
      default: console.log("### unprocessed operation: " + criteriaType); return error;
    }
  } else if (obj.hasOwnProperty(parts[0])) {
    if(parts.length==1) {
      var nextObj = (typeof obj[parts[0]] == 'object') ? obj[parts[0]] : obj;
      return processRule({$: criteria}, nextObj, path, parts[0]);
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
  if(criteria.$notEmpty && Array.isArray(obj) && obj.length==0) error.push(path + ":" + JSON.stringify(criteria));
  return error;
}
function checkEitherOf(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$eitherOf) {
    var failure=true;
    criteria.$eitherOf.forEach(item => { if(hasProperty(obj, item)) failure=false; });
    if(failure) error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkNoneOf(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$noneOf) {
    var failure=false;
    criteria.$noneOf.forEach(item => { failure = failure || hasProperty(obj, item); });
    if(failure) error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkInRule(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$in) {
    var failure=true;
    criteria.$in.forEach(item => { failure = failure & (obj[lastLabel] !== item); });
    if(failure) error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkPresent(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$present) {
    var failure=false;
    criteria.$present.forEach(item => { if(!hasProperty(obj, item)) failure=true; });
    if(failure) error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkPresentIf(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$presentIf && !hasProperty(obj, criteria.$presentIf)) {
    error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkNotEqual(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$notEqual && (obj[lastLabel] !== criteria.$notEqual)) {
    var subrule = cloneObject(criteria);
    delete subrule.$notEqual;
    const err = processRule({$: subrule}, obj, path, lastLabel);
    if(err.length>0) error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkEqual(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$equal && (obj[lastLabel] === criteria.$equal)) {
    var subrule = cloneObject(criteria);
    delete subrule.$equal;
    if(Object.keys(subrule).length>0) {
      const err = processRule({$: subrule}, obj, path, lastLabel);
      if(err.length>0) error.push(path + ":" + JSON.stringify(criteria));
    }
  } else {
    error.push(path + ":" + JSON.stringify(criteria));
  }
  return error;
}
function checkAndRule(criteria, obj, path, lastLabel) {
  var error = [];
  if(criteria.$and && Array.isArray(criteria.$and)) {
    var err = processRule({$: criteria.$and[0]}, obj, path, lastLabel);
    if(err.length===0) {
      var criterias = cloneObject(criteria.$and);
      criterias.shift();
      criterias.forEach(rule => { err = err.concat(processRule(rule, obj, path)); });
      if(err.length>0) error.push(path + ":" + JSON.stringify(criteria));
    }
  }
  return error;
}
function split2s(str, delim) {
  var p = str.indexOf(delim);
  return p !== -1 ? [str.substring(0,p), str.substring(p+1)] : [str];
}
function cloneObject(obj) { return JSON.parse(JSON.stringify(obj)); }
function hasProperty(obj, path) {
  var arr = path.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  return (obj !== undefined);
}

module.exports = { validateRequest, validateCategoryHref };
