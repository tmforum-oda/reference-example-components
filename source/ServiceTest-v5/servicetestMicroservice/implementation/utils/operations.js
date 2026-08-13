'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {
    if (operation === 'createServiceTest') {
      if (!doc['@type']) doc['@type'] = 'ServiceTest';
    }
    if (operation === 'createServiceTestSpecification') {
      if (!doc['@type']) doc['@type'] = 'ServiceTestSpecification';
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
