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

function storeEvent(req, res, next, operationName) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, operationName, payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules(operationName, payload))
    .then(payload => {
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload).then(() => {
          payload = cleanPayloadServiceType(payload);
          sendDoc(res, 201, payload);
          notificationUtils.publish(req, payload);
        }).catch(error => sendError(res, internalError));
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
}

exports.listenToPermissionCreateEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToPermissionCreateEvent');
};
exports.listenToPermissionAttributeValueChangeEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToPermissionAttributeValueChangeEvent');
};
exports.listenToPermissionStateChangeEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToPermissionStateChangeEvent');
};
exports.listenToPermissionDeleteEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToPermissionDeleteEvent');
};
exports.listenToUserRoleCreateEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToUserRoleCreateEvent');
};
exports.listenToUserRoleAttributeValueChangeEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToUserRoleAttributeValueChangeEvent');
};
exports.listenToUserRoleStateChangeEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToUserRoleStateChangeEvent');
};
exports.listenToUserRoleDeleteEvent = function(req, res, next) {
  storeEvent(req, res, next, 'listenToUserRoleDeleteEvent');
};
