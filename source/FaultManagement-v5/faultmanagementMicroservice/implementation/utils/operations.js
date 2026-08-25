'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    if (operation === 'createAlarm') {
      if (!doc['@type']) doc['@type'] = 'Alarm';
    }
    if (operation === 'createAckAlarm') {
      if (!doc['@type']) doc['@type'] = 'AckAlarm';
    }
    if (operation === 'createUnAckAlarm') {
      if (!doc['@type']) doc['@type'] = 'UnAckAlarm';
    }
    if (operation === 'createClearAlarm') {
      if (!doc['@type']) doc['@type'] = 'ClearAlarm';
    }
    if (operation === 'createCommentAlarm') {
      if (!doc['@type']) doc['@type'] = 'CommentAlarm';
    }
    if (operation === 'createGroupAlarm') {
      if (!doc['@type']) doc['@type'] = 'GroupAlarm';
    }
    if (operation === 'createUnGroupAlarm') {
      if (!doc['@type']) doc['@type'] = 'UnGroupAlarm';
    }

    resolve(doc);
  });
}

module.exports = { processAssignmentRules };
