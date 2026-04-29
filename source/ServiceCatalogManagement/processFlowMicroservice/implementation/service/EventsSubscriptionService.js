'use strict';

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const resourceType = 'EventSubscription';

module.exports.registerListener = function(req, res, next) {
  swaggerUtils.getPayload(req)
    .then(payload => {
      mongoUtils.connectToDatabase()
        .then(db => db.collection(resourceType).insertOne(payload))
        .then(result => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 201;
          res.end(JSON.stringify(payload));
        })
        .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
    })
    .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
};

module.exports.unregisterListener = function(req, res, next) {
  swaggerUtils.getResourceId(req)
    .then(id => {
      mongoUtils.connectToDatabase()
        .then(db => db.collection(resourceType).deleteOne({ id }))
        .then(result => {
          res.statusCode = 204;
          res.end();
        })
        .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
    })
    .catch(error => sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, error)));
};
