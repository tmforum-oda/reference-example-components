'use strict';

const mongoUtils = require('../utils/mongoUtils');
const {sendDoc} = require('../utils/mongoUtils');
const {getResponseType} = require('../utils/swaggerUtils');
const {cleanPayloadServiceType} = require('../utils/swaggerUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

exports.listMonitor = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  var query = mongoUtils.getMongoQuery(req);
  mongoUtils.connect().then(db => {
    db.collection(resourceType).stats().then(stats => {
      const totalSize = stats.count;
      db.collection(resourceType).find(query.criteria, query.options).toArray().then(doc => {
        doc = cleanPayloadServiceType(doc);
        res.setHeader('X-Total-Count', totalSize);
        res.setHeader('X-Result-Count', doc.length);
        var code = 200;
        sendDoc(res, code, doc);
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};

exports.retrieveMonitor = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  var query = mongoUtils.getMongoQuery(req);
  const id = req.swagger.params['id'].value;
  query.criteria.id = id;
  mongoUtils.connect().then(db => {
    db.collection(resourceType).findOne(query.criteria, query.options).then(doc => {
      if (doc == undefined) {
        sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
      } else {
        doc = cleanPayloadServiceType(doc);
        sendDoc(res, 200, doc);
      }
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};
