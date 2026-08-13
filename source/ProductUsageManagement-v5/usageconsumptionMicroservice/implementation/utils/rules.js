'use strict';

//
// validationRulesType2: per-resource business validation rules.
// Add one entry per resource type. Used by ruleUtils.validateRequest() if called from a service override.
// In v5, express-openapi-validator handles schema validation; these rules cover business constraints
// beyond the spec (e.g. sub-object field co-dependencies).
//
var validationRulesType2 = {};

// Add resource-specific rules here. Example:
// validationRulesType2['{ResourceType}'] = {
//   'POST': [
//     { attribute: '{mandatoryField}', rule: 'required', message: 'missing attribute' }
//   ]
// };

var validationRules = {};

module.exports = { validationRules, validationRulesType2 };
