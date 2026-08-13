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

exports.listenToResourceCreateEvent = function(req, res, next) {
  listenTo('listenToResourceCreateEvent', req, res, next);
};
exports.listenToResourceAttributeValueChangeEvent = function(req, res, next) {
  listenTo('listenToResourceAttributeValueChangeEvent', req, res, next);
};
exports.listenToResourceStateChangeEvent = function(req, res, next) {
  listenTo('listenToResourceStateChangeEvent', req, res, next);
};
exports.listenToResourceDeleteEvent = function(req, res, next) {
  listenTo('listenToResourceDeleteEvent', req, res, next);
};
exports.listenToMonitorCreateEvent = function(req, res, next) {
  listenTo('listenToMonitorCreateEvent', req, res, next);
};
exports.listenToMonitorAttributeValueChangeEvent = function(req, res, next) {
  listenTo('listenToMonitorAttributeValueChangeEvent', req, res, next);
};
exports.listenToMonitorStateChangeEvent = function(req, res, next) {
  listenTo('listenToMonitorStateChangeEvent', req, res, next);
};
exports.listenToMonitorDeleteEvent = function(req, res, next) {
  listenTo('listenToMonitorDeleteEvent', req, res, next);
};
