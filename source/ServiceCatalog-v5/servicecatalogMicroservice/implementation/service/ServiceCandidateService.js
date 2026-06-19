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

const generateQueryString = function(query, offset, limit) {
  var queryStr = '';
  if (query.criteria !== undefined) {
    Object.keys(query.criteria).forEach(function(key) { queryStr += key + '=' + query.criteria[key] + '&'; });
  }
  if (limit !== undefined) queryStr += 'limit=' + limit + '&';
  if (offset !== undefined) queryStr += 'offset=' + offset;
  return queryStr;
};
const generateLink = function(query, skip, limit, type, totalSize) {
  var offset;
  switch(type) {
    case 'first': offset = 0; break;
    case 'prev':  offset = Math.max(0, skip - limit); break;
    case 'next':  offset = skip + limit; break;
    case 'last':  offset = Math.max(0, totalSize - limit); break;
    default:      offset = skip;
  }
  return '<?' + generateQueryString(query, offset, limit) + '>; rel="' + type + '"';
};
const setLinks = function(res, query, skip, limit, totalSize) {
  var links = [];
  links.push(generateLink(query, skip, limit, 'self', totalSize));
  if (skip > 0) links.push(generateLink(query, skip, limit, 'first', totalSize));
  if (skip > 0) links.push(generateLink(query, skip, limit, 'prev', totalSize));
  if (limit && (skip + limit) < totalSize) links.push(generateLink(query, skip, limit, 'next', totalSize));
  if (limit && (skip + limit) < totalSize) links.push(generateLink(query, skip, limit, 'last', totalSize));
  res.setHeader('Link', links.join(', '));
};

exports.createServiceCandidate = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createServiceCandidate', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createServiceCandidate', payload))
    .then(payload => {
      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');
      mongoUtils.connect().then(db => {
        db.collection(resourceType).insertOne(payload).then(() => {
          payload = cleanPayloadServiceType(payload);
          sendDoc(res, 201, payload);
          notificationUtils.publish(req, payload);
        }).catch(error => { console.log("createServiceCandidate: error=" + error); sendError(res, internalError); });
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
};
exports.listServiceCandidate = function(req, res, next) {
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
        var skip = query.options.skip !== undefined ? parseInt(query.options.skip) : 0;
        var limit;
        if (query.options.limit !== undefined) limit = parseInt(query.options.limit);
        if (limit || skip > 0) setLinks(res, query, skip, limit, totalSize);
        var code = 200;
        if (limit && doc.length < totalSize) code = 206;
        sendDoc(res, code, doc);
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};
exports.retrieveServiceCandidate = function(req, res, next) {
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
exports.patchServiceCandidate = function(req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'patchServiceCandidate', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => {
      mongoUtils.connect().then(db => {
        const id = req.swagger.params['id'].value;
        const query = { id: id };
        db.collection(resourceType).findOne(query).then(old => {
          if (old == undefined) {
            return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
          }
          payload = swaggerUtils.updatePayloadServiceType(payload, req, 'id');
          db.collection(resourceType).updateOne(query, {$set: payload}).then(() => {
            db.collection(resourceType).findOne(query).then(doc => {
              doc = swaggerUtils.cleanPayloadServiceType(doc);
              sendDoc(res, 200, doc);
              notificationUtils.publish(req, doc, old);
            }).catch(error => sendError(res, internalError));
          }).catch(error => sendError(res, internalError));
        }).catch(error => sendError(res, internalError));
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, error));
};
exports.deleteServiceCandidate = function(req, res, next) {
  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  mongoUtils.connect().then(db => {
    const id = req.swagger.params['id'].value;
    const query = { id: id };
    db.collection(resourceType).findOne(query).then(old => {
      if (old == undefined) {
        return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
      }
      db.collection(resourceType).deleteOne(query).then(() => {
        sendDoc(res, 204, {});
        notificationUtils.publish(req, old);
      }).catch(error => sendError(res, internalError));
    }).catch(error => sendError(res, internalError));
  }).catch(error => sendError(res, internalError));
};