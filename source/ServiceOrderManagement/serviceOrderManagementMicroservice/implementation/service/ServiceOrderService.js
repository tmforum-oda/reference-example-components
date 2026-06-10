'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const listResource = require('../utils/listResource').listResource;
const retrieveResource = require('../utils/retrieveResource').retrieveResource;
const {sendDoc} = require('../utils/mongoUtils');
const {setBaseProperties, traverse, addHref, processCommonAttributes} = require('../utils/operationsUtils');
const {validateRequest} = require('../utils/ruleUtils');
const {processAssignmentRules} = require('../utils/operations');
const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');
const {updateQueryServiceType, updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

exports.createServiceOrder = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createServiceOrder', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createServiceOrder', payload))
    .then(payload => {
      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload)
          .then(() => {
            payload = cleanPayloadServiceType(payload);
            sendDoc(res, 201, payload);
            notificationUtils.publish(req, payload);
          })
          .catch(error => { console.log("createServiceOrder: error=" + error); sendError(res, internalError); })
      }).catch(error => { sendError(res, internalError); });
    }).catch(error => sendError(res, error));
};

exports.listServiceOrder = function(req, res, next) {
  listResource(req, res, next);
};

exports.retrieveServiceOrder = function(req, res, next) {
  retrieveResource(req, res, next);
};

exports.patchServiceOrder = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const id = swaggerUtils.getResourceId(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'patchServiceOrder', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('patchServiceOrder', payload))
    .then(payload => {
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).find({ id: id }).toArray()
          .then((items) => {
            if (items.length === 0) {
              const notFoundError = new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found");
              sendError(res, notFoundError);
              return;
            }
            db.collection(resourceType).updateOne({ id: id }, { $set: payload })
              .then(() => {
                return db.collection(resourceType).find({ id: id }).toArray();
              })
              .then((items) => {
                items = cleanPayloadServiceType(items);
                sendDoc(res, 200, items[0]);
                notificationUtils.publish(req, items[0]);
              })
              .catch(error => { console.log("patchServiceOrder: error=" + error); sendError(res, internalError); })
          })
          .catch(error => { sendError(res, internalError); });
      }).catch(error => { sendError(res, internalError); });
    }).catch(error => sendError(res, error));
};

exports.deleteServiceOrder = function(req, res, next) {
  const resourceType = getResponseType(req);
  const id = swaggerUtils.getResourceId(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType).deleteOne({ id: id })
      .then((result) => {
        if (result.deletedCount === 0) {
          const notFoundError = new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found");
          sendError(res, notFoundError);
          return;
        }
        res.statusCode = 204;
        res.end();
        notificationUtils.publish(req, { id: id });
      })
      .catch(error => { console.log("deleteServiceOrder: error=" + error); sendError(res, internalError); })
  }).catch(error => { sendError(res, internalError); });
};
