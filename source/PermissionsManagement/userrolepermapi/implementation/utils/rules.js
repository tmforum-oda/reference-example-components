'use strict';

var validationRulesType2 = {};

validationRulesType2['Permission'] = {
  'POST': [
    {attribute: 'name', rule: 'required', message: 'missing attribute'}
  ],
  'PATCH': []
};

validationRulesType2['UserRole'] = {
  'POST': [
    {attribute: 'name', rule: 'required', message: 'missing attribute'}
  ],
  'PATCH': []
};

var validationRules = {};

module.exports = {validationRules, validationRulesType2};
