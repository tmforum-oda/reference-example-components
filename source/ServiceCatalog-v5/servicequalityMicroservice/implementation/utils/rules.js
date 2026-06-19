'use strict';

var validationRulesType2 = {};

validationRulesType2['ServiceLevelObjective'] = {
  'POST': [
    { attribute: 'conformanceComparator', rule: 'required', message: 'missing attribute conformanceComparator' },
    { attribute: 'conformanceTarget', rule: 'required', message: 'missing attribute conformanceTarget' },
    { attribute: 'serviceLevelObjectiveParameter', rule: 'required', message: 'missing attribute serviceLevelObjectiveParameter' }
  ]
};
validationRulesType2['ServiceLevelSpecification'] = {
  'POST': [
    { attribute: 'name', rule: 'required', message: 'missing attribute name' },
    { attribute: 'relatedServiceLevelObjective', rule: 'required', message: 'missing attribute relatedServiceLevelObjective' }
  ]
};
validationRulesType2['EventSubscription'] = {
  'POST': [{ attribute: 'callback', rule: 'required', message: 'missing attribute callback' }]
};

var validationRules = {};
module.exports = { validationRules, validationRulesType2 };
