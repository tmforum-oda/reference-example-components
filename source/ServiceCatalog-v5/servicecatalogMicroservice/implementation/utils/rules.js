'use strict';

var validationRulesType2 = {};

validationRulesType2['ServiceCatalog'] = {
  'POST': [{ attribute: 'name', rule: 'required', message: 'missing attribute name' }]
};
validationRulesType2['ServiceCategory'] = {
  'POST': [{ attribute: 'name', rule: 'required', message: 'missing attribute name' }]
};
validationRulesType2['ServiceCandidate'] = {
  'POST': [
    { attribute: 'name', rule: 'required', message: 'missing attribute name' },
    { attribute: 'serviceSpecification', rule: 'required', message: 'missing attribute serviceSpecification' }
  ]
};
validationRulesType2['ServiceSpecification'] = {
  'POST': [{ attribute: 'name', rule: 'required', message: 'missing attribute name' }]
};
validationRulesType2['ExportJob'] = {
  'POST': [{ attribute: 'url', rule: 'required', message: 'missing attribute url' }]
};
validationRulesType2['ImportJob'] = {
  'POST': [{ attribute: 'url', rule: 'required', message: 'missing attribute url' }]
};
validationRulesType2['EventSubscription'] = {
  'POST': [{ attribute: 'callback', rule: 'required', message: 'missing attribute callback' }]
};

var validationRules = {};
module.exports = { validationRules, validationRulesType2 };
