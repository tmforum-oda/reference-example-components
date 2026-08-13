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

function listenTo(operationId, req, res, next) {
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

exports.listenToUsageCreateEvent = function(req, res, next) {
  listenTo('listenToUsageCreateEvent', req, res, next);
};
exports.listenToUsageAttributeValueChangeEvent = function(req, res, next) {
  listenTo('listenToUsageAttributeValueChangeEvent', req, res, next);
};
exports.listenToUsageDeleteEvent = function(req, res, next) {
  listenTo('listenToUsageDeleteEvent', req, res, next);
};
exports.listenToUsageStateChangeEvent = function(req, res, next) {
  listenTo('listenToUsageStateChangeEvent', req, res, next);
};
exports.listenToUsageSpecificationCreateEvent = function(req, res, next) {
  listenTo('listenToUsageSpecificationCreateEvent', req, res, next);
};
exports.listenToUsageSpecificationAttributeValueChangeEvent = function(req, res, next) {
  listenTo('listenToUsageSpecificationAttributeValueChangeEvent', req, res, next);
};
exports.listenToUsageSpecificationDeleteEvent = function(req, res, next) {
  listenTo('listenToUsageSpecificationDeleteEvent', req, res, next);
};
