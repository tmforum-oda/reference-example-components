'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const resourceType = 'ProcessFlow';
const basePath = swaggerUtils.getResourceType(resourceType);

module.exports.createProcessFlow = function(req, res, next) {
  swaggerUtils.getPayload(req)
    .then(payload => swaggerUtils.validateRequest(req, 'createProcessFlow', payload))
    .then(payload => swaggerUtils.traverse(req, basePath, payload, 'create'))
    .then(payload => mongoUtils.processCommonAttributes(req, resourceType, payload))
    .then(payload => mongoUtils.processAssignmentRules('createProcessFlow', resourceType, payload))
    .then(payload => {
      const internalError = null;
      mongoUtils.connectToDatabase()
        .then(db => db.collection(resourceType).insertOne(payload))
        .then(result => sendDoc(res, 201, payload))
        .then(() => notificationUtils.publish(req, res, payload))
        .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
    })
    .catch(error => {
      if (error.name === 'TError') sendError(res, error);
      else sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error));
    });
};

module.exports.deleteProcessFlow = function(req, res, next) {
  swaggerUtils.getResourceId(req)
    .then(id => {
      mongoUtils.connectToDatabase()
        .then(db => db.collection(resourceType).deleteOne({ id }))
        .then(result => {
          if (result.deletedCount === 0) {
            sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'Not Found'));
          } else {
            sendDoc(res, 204, {});
          }
        })
        .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
    })
    .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
};

module.exports.listProcessFlow = function(req, res, next) {
  mongoUtils.listResource(req, res, next, resourceType);
};

module.exports.retrieveProcessFlow = function(req, res, next) {
  mongoUtils.retrieveResource(req, res, next, resourceType);
};

function sendDoc(res, code, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = code;
  res.end(JSON.stringify(payload));
}
