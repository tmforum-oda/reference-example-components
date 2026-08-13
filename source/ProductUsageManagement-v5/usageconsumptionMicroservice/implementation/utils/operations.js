'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    if (operation === 'createQueryUsageConsumption') {
      if (!doc.usageConsumption) doc.usageConsumption = [];
      if (!doc.errorMessage) doc.errorMessage = [{ '@type': 'ErrorMessage' }];
      if (!doc.partyAccount) doc.partyAccount = [{ '@type': 'PartyAccountRef', id: 'sample_id' }];
      if (!doc.state) doc.state = 'acknowledged';
    }

    if (operation === 'createUsageConsumptionReport') {
      if (!doc.name) doc.name = 'sample_name';
      if (!doc.bucket) doc.bucket = [{ '@type': 'Bucket', id: 'sample_id' }];
      if (!doc.description) doc.description = 'sample_description';
      if (!doc.logicalResource) doc.logicalResource = [{ '@type': 'LogicalResourceRef', id: 'sample_id' }];
      if (!doc.partyAccount) doc.partyAccount = [{ '@type': 'PartyAccountRef', id: 'sample_id' }];
      if (!doc.product) doc.product = [{ '@type': 'UsageConsumptionProductRef', id: 'sample_id' }];
      if (!doc.relatedParty) doc.relatedParty = [{ '@type': 'RelatedPartyRefOrPartyRoleRef', role: 'sample_role', partyOrPartyRole: { '@type': 'PartyRef', id: 'sample_id' } }];
      if (!doc.validPeriod) doc.validPeriod = { startDateTime: new Date().toISOString(), endDateTime: new Date().toISOString() };
    }

    resolve(doc);
  });
}

module.exports = { processAssignmentRules };
