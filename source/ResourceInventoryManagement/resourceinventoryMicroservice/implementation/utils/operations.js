'use strict';

const {TError, TErrorEnum} = require('../utils/errorUtils');

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {
    resolve(doc);
  });
}

function processAssignmentRulesByType(req, resourceType, payload) {
  return new Promise(function(resolve, reject) {
    resolve(payload);
  });
}

module.exports = { processAssignmentRules, processAssignmentRulesByType };
