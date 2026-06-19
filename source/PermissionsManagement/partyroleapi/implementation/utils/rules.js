'use strict';

var validationRulesType2 = {};

validationRulesType2['PartyRole'] = {
  'POST': [
    {attribute: 'name', rule: 'required', message: 'missing attribute'}
  ],
  'PATCH': []
};

validationRulesType2['PartyRoleSpecification'] = {
  'POST': [
    {attribute: 'name', rule: 'required', message: 'missing attribute'}
  ],
  'PATCH': []
};

var validationRules = {};

module.exports = {validationRules, validationRulesType2};
