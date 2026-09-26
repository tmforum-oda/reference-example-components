'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const resourceType = 'TaskFlow';
const basePath = swaggerUtils.getResourceType(resourceType);

module.exports.listTaskFlow = function(req, res, next) {
  const processFlowId = req.swagger.params['processFlowId'].value;
  const query = Object.assign({ processFlowId }, mongoUtils.buildQuery(req));
  mongoUtils.connectToDatabase()
    .then(db => db.collection(resourceType).find(query).toArray())
    .then(docs => {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(docs));
    })
    .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
};

module.exports.retrieveTaskFlow = function(req, res, next) {
  const processFlowId = req.swagger.params['processFlowId'].value;
  const id = req.swagger.params['id'].value;
  mongoUtils.connectToDatabase()
    .then(db => db.collection(resourceType).findOne({ processFlowId, id }))
    .then(doc => {
      if (!doc) {
        sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'Not Found'));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(doc));
      }
    })
    .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
};

module.exports.patchTaskFlow = function(req, res, next) {
  const processFlowId = req.swagger.params['processFlowId'].value;
  const id = req.swagger.params['id'].value;
  swaggerUtils.getPayload(req)
    .then(payload => swaggerUtils.validateRequest(req, 'patchTaskFlow', payload))
    .then(payload => swaggerUtils.traverse(req, basePath, payload, 'patch'))
    .then(payload => {
      mongoUtils.connectToDatabase()
        .then(db => db.collection(resourceType).findOneAndUpdate(
          { processFlowId, id },
          { $set: payload },
          { returnOriginal: false }
        ))
        .then(result => {
          if (!result.value) {
            sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, 'Not Found'));
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(result.value));
            notificationUtils.publish(req, res, result.value);
          }
        })
        .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
    })
    .catch(error => {
      if (error.name === 'TError') sendError(res, error);
      else sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error));
    });
};
