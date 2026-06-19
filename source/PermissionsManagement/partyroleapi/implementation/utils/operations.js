'use strict';

//
// processAssignmentRules — sets component-specific computed fields at creation time.
// Add an if-block for each create operation that needs auto-populated state or derived fields.
// Example: setting state='acknowledged', computing timestamps, etc.
//
function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    // Add component-specific rules here. Examples:
    //
    // if (operation === 'create{Resource}') {
    //   doc.state = 'acknowledged';
    //   doc.orderDate = new Date();
    // }

    resolve(doc);
  });
}

module.exports = { processAssignmentRules };
