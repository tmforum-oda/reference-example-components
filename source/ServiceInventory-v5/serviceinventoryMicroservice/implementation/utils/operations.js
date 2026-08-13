'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {
    if (operation === 'createService') {
      if (!doc['@type']) doc['@type'] = 'Service';
    }
    resolve(doc);
  });
}

module.exports = { processAssignmentRules };
