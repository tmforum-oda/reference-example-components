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

exports.listenToServiceTestCreateEvent = function(req, res, next) {
  listenTo('listenToServiceTestCreateEvent', req, res, next);
};
exports.listenToServiceTestAttributeValueChangeEvent = function(req, res, next) {
  listenTo('listenToServiceTestAttributeValueChangeEvent', req, res, next);
};
exports.listenToServiceTestStateChangeEvent = function(req, res, next) {
  listenTo('listenToServiceTestStateChangeEvent', req, res, next);
};
exports.listenToServiceTestDeleteEvent = function(req, res, next) {
  listenTo('listenToServiceTestDeleteEvent', req, res, next);
};
exports.listenToServiceTestSpecificationCreateEvent = function(req, res, next) {
  listenTo('listenToServiceTestSpecificationCreateEvent', req, res, next);
};
exports.listenToServiceTestSpecificationAttributeValueChangeEvent = function(req, res, next) {
  listenTo('listenToServiceTestSpecificationAttributeValueChangeEvent', req, res, next);
};
exports.listenToServiceTestSpecificationDeleteEvent = function(req, res, next) {
  listenTo('listenToServiceTestSpecificationDeleteEvent', req, res, next);
};
