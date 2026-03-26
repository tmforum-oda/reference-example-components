'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const listResource = require('../utils/listResource').listResource;
const retrieveResource = require('../utils/retrieveResource').retrieveResource;
const {sendDoc} = require('../utils/mongoUtils');
const {traverse, processCommonAttributes} = require('../utils/operationsUtils');
const {validateRequest} = require('../utils/ruleUtils');
const {processAssignmentRules} = require('../utils/operations');
const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');
const {updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

exports.createServiceCatalog = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createServiceCatalog', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createServiceCatalog', payload))
    .then(payload => {
      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, 'Internal database error');
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload)
          .then(() => {
            payload = cleanPayloadServiceType(payload);
            sendDoc(res, 201, payload);
            notificationUtils.publish(req, payload);
          })
          .catch(error => { console.log('createServiceCatalog: error=' + error); sendError(res, internalError); });
      }).catch(error => { sendError(res, internalError); });
    }).catch(error => sendError(res, error));
};

exports.listServiceCatalog = function(req, res, next) {
  listResource(req, res, next);
};

exports.retrieveServiceCatalog = function(req, res, next) {
  retrieveResource(req, res, next);
};

exports.patchServiceCatalog = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'patchServiceCatalog', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('patchServiceCatalog', payload))
    .then(payload => {
      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, 'Internal database error');
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      const id = swaggerUtils.getResourceId(req);
      mongoUtils.connect().then(db => {
        db.collection(resourceType).findOneAndUpdate({ id: id }, { $set: payload }, { returnOriginal: false })
          .then(result => {
            if (!result.value) return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'No resource with given id found'));
            let doc = cleanPayloadServiceType(result.value);
            sendDoc(res, 200, doc);
            notificationUtils.publish(req, doc);
          })
          .catch(error => { console.log('patchServiceCatalog: error=' + error); sendError(res, internalError); });
      }).catch(error => { sendError(res, internalError); });
    }).catch(error => sendError(res, error));
};

exports.deleteServiceCatalog = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, 'Internal database error');
  const id = swaggerUtils.getResourceId(req);
  mongoUtils.connect().then(db => {
    db.collection(resourceType).deleteOne({ id: id })
      .then(result => {
        if (result.deletedCount === 0) return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'No resource with given id found'));
        sendDoc(res, 204, {});
      })
      .catch(error => { console.log('deleteServiceCatalog: error=' + error); sendError(res, internalError); });
  }).catch(error => { sendError(res, internalError); });
};
