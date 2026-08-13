'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const {sendDoc} = require('../utils/mongoUtils');
const {traverse, processCommonAttributes} = require('../utils/operationsUtils');
const {validateRequest} = require('../utils/ruleUtils');
const {processAssignmentRules} = require('../utils/operations');
const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');
const {updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

function listenToEvent(req, res, next, operationId) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, operationId, payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules(operationId, payload))
    .then(payload => {
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload).then(() => {
          payload = cleanPayloadServiceType(payload);
          sendDoc(res, 201, payload);
          notificationUtils.publish(req, payload);
        }).catch(error => { console.log(operationId + ": error=" + error); sendError(res, internalError); });
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
}

exports.listenToResourceOrderCreateEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToResourceOrderCreateEvent');
};

exports.listenToResourceOrderAttributeValueChangeEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToResourceOrderAttributeValueChangeEvent');
};

exports.listenToResourceOrderDeleteEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToResourceOrderDeleteEvent');
};

exports.listenToResourceOrderStateChangeEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToResourceOrderStateChangeEvent');
};

exports.listenToResourceOrderInformationRequiredEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToResourceOrderInformationRequiredEvent');
};

exports.listenToCancelResourceOrderCreateEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToCancelResourceOrderCreateEvent');
};

exports.listenToCancelResourceOrderStateChangeEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToCancelResourceOrderStateChangeEvent');
};

exports.listenToCancelResourceOrderInformationRequiredEvent = function(req, res, next) {
  listenToEvent(req, res, next, 'listenToCancelResourceOrderInformationRequiredEvent');
};
