'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {
    if (operation === 'createProductTest') {
      if (!doc['@type']) doc['@type'] = 'ProductTest';
    }
    if (operation === 'createProductTestSpecification') {
      if (!doc['@type']) doc['@type'] = 'ProductTestSpecification';
    }
    resolve(doc);
  });
}

function processAssignmentRulesByType(req, type, doc) {
  return new Promise(function(resolve, reject) {
    resolve(doc);
  });
}

module.exports = { processAssignmentRules, processAssignmentRulesByType };
