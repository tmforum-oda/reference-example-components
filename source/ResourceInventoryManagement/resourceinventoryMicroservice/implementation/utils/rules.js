'use strict';

const validationRules = {};

const validationRulesType2 = {
  "Resource": {
    "operations": ["GET", "PATCH", "POST", "DELETE"],
    "POST": [
      {"resourceSpecification": {$eitherOf: ["id", "href"]}},
      {"partyRole": {$eitherOf: ["id", "href"]}},
      {"resourceRelationship": {$present: ["type"]}},
      {"note": {$present: ["text"]}},
      {"place": {$present: ["role"]}},
      {"place": {$eitherOf: ["id", "href"]}},
      {$: {$present: ["name", "@type"]}}
    ],
    "PATCH": [
      {$: {$noneOf: ["id", "href"]}},
      {"resourceSpecification": {$eitherOf: ["id", "href"]}},
      {"partyRole": {$eitherOf: ["id", "href"]}},
      {"resourceRelationship": {$present: ["type"]}},
      {"note": {$present: ["text"]}},
      {"place": {$present: ["role"]}},
      {"place": {$eitherOf: ["id", "href"]}}
    ]
  }
};

module.exports = { validationRules, validationRulesType2 };
