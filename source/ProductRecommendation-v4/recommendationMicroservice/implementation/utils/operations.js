'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    if (operation === 'createQueryProductRecommendation') {
      if (!doc['@type']) doc['@type'] = 'QueryProductRecommendation';
      if (!doc.recommendationItem) doc.recommendationItem = [{ '@type': 'RecommendationItem', id: 'sample_id', priority: 1, product: { '@type': 'ProductRefOrValue', id: 'sample_id' } }];
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
