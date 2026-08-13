'use strict';

const fs = require('fs');
const jsyaml = require('js-yaml');
const logger = require('../logger');
const swaggerUtils = require('../utils/swaggerUtils');
const config = require('../config');
const { generateSampleValue } = require('../utils/operationsUtils');

var conformanceDoc = null;

function getConformanceDoc() {
  if (conformanceDoc == null && config.conformance) {
    const spec = fs.readFileSync(config.conformance, 'utf8');
    conformanceDoc = jsyaml.load(spec);
  }
  return conformanceDoc;
}

//
// Reads a conformance.yaml (path set in config.conformance) and generates sample values
// for any mandatory attributes (condition starts with 'M') not already present in the payload.
// If no conformance.yaml is configured, this is a no-op.
//
async function populateMandatoryAttributes(type, obj, req) {
  return new Promise(function(resolve, reject) {
    try {
      const typedef = swaggerUtils.getTypeDefinition(type);
      if (!typedef) return resolve(obj);

      var conformance = getConformanceDoc();
      if (!conformance) return resolve(obj);

      if (conformance?.conformance?.[type]) {
        conformance = conformance.conformance[type];
        const attributes = Object.keys(conformance.attributes);

        var mandatory = attributes
          .map(a => ({ attribute: a, conformance: conformance.attributes[a] }))
          .filter(a => a.conformance.condition)
          .filter(a => a.conformance.condition.startsWith('M'))
          .filter(m => !m.attribute.includes('.'))
          .filter(m => !obj[m.attribute]);

        mandatory.forEach(m => {
          obj[m.attribute] = generateSampleValue(type, m.attribute);
        });
      }

      return resolve(obj);
    } catch (e) {
      logger.error('populateMandatoryAttributes: error=' + e);
      return resolve(obj);
    }
  });
}

module.exports = { populateMandatoryAttributes };
