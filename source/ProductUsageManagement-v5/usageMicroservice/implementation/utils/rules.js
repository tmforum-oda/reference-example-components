'use strict';

var validationRulesType2 = {};

validationRulesType2['Usage'] = {
  'POST': [
    {attribute: 'usageType', rule: 'required', message: 'missing attribute usageType'}
  ],
  'PATCH': []
};

validationRulesType2['UsageSpecification'] = {
  'POST': [
    {attribute: 'name', rule: 'required', message: 'missing attribute name'}
  ],
  'PATCH': []
};

var validationRules = {};

module.exports = {validationRules, validationRulesType2};
