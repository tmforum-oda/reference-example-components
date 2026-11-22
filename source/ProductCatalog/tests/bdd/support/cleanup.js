'use strict';

const { CLEANUP_ORDER } = require('./config');

// Orders created resources for deletion: dependants first (offerings before the
// prices and specifications they refer to, categories before catalogs), newest
// first within a type (so a sub-category goes before its parent).
function cleanupPlan(created) {
  return CLEANUP_ORDER.flatMap(type => created.filter(r => r.resource === type).reverse());
}

module.exports = { cleanupPlan };
