'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    if (operation === 'createServiceSpecification') {
      if (doc.isBundle === undefined) doc.isBundle = false;
      if (doc.lifecycleStatus === undefined) doc.lifecycleStatus = 'In Study';
    }

    if (operation === 'createServiceCandidate') {
      if (doc.lifecycleStatus === undefined) doc.lifecycleStatus = 'In Study';
    }

    if (operation === 'createServiceCategory') {
      if (doc.isRoot === undefined) doc.isRoot = false;
      if (doc.lifecycleStatus === undefined) doc.lifecycleStatus = 'In Study';
    }

    resolve(doc);
  });
}

module.exports = { processAssignmentRules };
