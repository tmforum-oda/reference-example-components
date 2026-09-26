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

exports.registerListener = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'registerListener', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('registerListener', payload))
    .then(payload => {
      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, 'Internal database error');
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload)
          .then(() => {
            payload = cleanPayloadServiceType(payload);
            sendDoc(res, 201, payload);
          })
          .catch(error => { console.log('registerListener: error=' + error); sendError(res, internalError); });
      }).catch(error => { sendError(res, internalError); });
    }).catch(error => sendError(res, error));
};

exports.unregisterListener = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, 'Internal database error');
  const id = swaggerUtils.getResourceId(req);
  mongoUtils.connect().then(db => {
    db.collection(resourceType).deleteOne({ id: id })
      .then(result => {
        if (result.deletedCount === 0) return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'No resource with given id found'));
        sendDoc(res, 204, {});
      })
      .catch(error => { console.log('unregisterListener: error=' + error); sendError(res, internalError); });
  }).catch(error => { sendError(res, internalError); });
};
