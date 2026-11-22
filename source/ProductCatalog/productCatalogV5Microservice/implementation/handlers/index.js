'use strict';

// Maps each TMF620 v5 operationId to a handler (req, res, next).
//
// In scope for issue #87: create / list / retrieve / patch / delete for
// productCatalog, category, productOffering, productOfferingPrice and
// productSpecification (handlers/resources.js). The other operations (hub,
// listeners, import/export jobs) answer 501.

const { sendError } = require('../utils/tmfError');

const RESOURCES = ['ProductCatalog', 'Category', 'ProductOffering', 'ProductOfferingPrice', 'ProductSpecification'];
const VERBS = ['create', 'list', 'retrieve', 'patch', 'delete'];

const IN_SCOPE = new Set(RESOURCES.flatMap(r => VERBS.map(v => v + r)));

function notImplemented(operationId, why) {
  return function (req, res) {
    sendError(res, 501, 'TMF620-V5-501', 'Operation not implemented',
      `${operationId} (${req.method} ${req.path}) ${why}`);
  };
}

// implemented: handlers keyed by operationId (from resources.createHandlers)
function handlerLookup(implemented) {
  return function handlerFor(operationId) {
    if (implemented && implemented[operationId]) return implemented[operationId];
    if (IN_SCOPE.has(operationId)) return notImplemented(operationId, 'is not available: this API was started without a database.');
    return notImplemented(operationId, 'is not part of this reference implementation, which covers catalog, category, productOffering, productOfferingPrice and productSpecification.');
  };
}

module.exports = { handlerLookup, IN_SCOPE, RESOURCES, VERBS };
