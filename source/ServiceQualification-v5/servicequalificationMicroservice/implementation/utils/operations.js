'use strict';

function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    if (operation === 'createCheckServiceQualification') {
      doc.checkServiceQualificationDate = doc.checkServiceQualificationDate ?? new Date().toISOString();
      doc.effectiveQualificationDate = doc.effectiveQualificationDate ?? new Date().toISOString();
      doc.estimatedResponseDate = doc.estimatedResponseDate ?? new Date().toISOString();
      doc.expectedQualificationDate = doc.expectedQualificationDate ?? new Date().toISOString();
      doc.expirationDate = doc.expirationDate ?? new Date().toISOString();
      doc.qualificationResult = doc.qualificationResult ?? 'qualified';
      doc.description = doc.description ?? '';
      doc.state = doc.state ?? 'inProgress';
      doc.errorMessage = doc.errorMessage ?? [{ '@type': 'ErrorMessage' }];
    }

    if (operation === 'createQueryServiceQualification') {
      doc.effectiveQualificationDate = doc.effectiveQualificationDate ?? new Date().toISOString();
      doc.estimatedResponseDate = doc.estimatedResponseDate ?? new Date().toISOString();
      doc.expectedQualificationDate = doc.expectedQualificationDate ?? new Date().toISOString();
      doc.expirationDate = doc.expirationDate ?? new Date().toISOString();
      doc.queryServiceQualificationDate = doc.queryServiceQualificationDate ?? new Date().toISOString();
      doc.description = doc.description ?? '';
      doc.state = doc.state ?? 'inProgress';
      doc.errorMessage = doc.errorMessage ?? [{ '@type': 'ErrorMessage' }];
      doc.serviceQualificationItem = doc.serviceQualificationItem ?? [{ '@type': 'ServiceQualificationItem' }];
    }

    resolve(doc);
  });
}

module.exports = { processAssignmentRules };
