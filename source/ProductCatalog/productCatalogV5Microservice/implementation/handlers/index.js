'use strict';

// Maps each TMF620 v5 operationId to a handler (req, res, next).
//
// In scope for issue #87: create / list / retrieve / patch / delete for
// productCatalog, category, productOffering, productOfferingPrice and
// productSpecification. Their handlers are added in task T10; until then they
// answer 501 like the out-of-scope operations (hub, listeners, import/export jobs).

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

// Handlers implemented so far, keyed by operationId. T10 fills this in.
const implemented = {};

function handlerFor(operationId) {
  if (implemented[operationId]) return implemented[operationId];
  if (IN_SCOPE.has(operationId)) return notImplemented(operationId, 'is planned but not implemented yet (issue #87, task T10).');
  return notImplemented(operationId, 'is not part of this reference implementation, which covers catalog, category, productOffering, productOfferingPrice and productSpecification.');
}

module.exports = { handlerFor, IN_SCOPE, RESOURCES, VERBS };
