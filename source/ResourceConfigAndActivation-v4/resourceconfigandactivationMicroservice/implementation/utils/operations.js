'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {
    if (operation === 'createResource') {
      if (!doc['@type']) doc['@type'] = 'Resource';
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
