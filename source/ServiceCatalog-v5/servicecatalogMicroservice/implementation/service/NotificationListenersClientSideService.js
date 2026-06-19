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

function listenTo(eventType, req, res, next) {
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, eventType, payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules(eventType, payload))
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

exports.listenToServiceCatalogCreateEvent = function(req,res,next){ listenTo('listenToServiceCatalogCreateEvent', req, res, next); };
exports.listenToServiceCatalogChangeEvent = function(req,res,next){ listenTo('listenToServiceCatalogChangeEvent', req, res, next); };
exports.listenToServiceCatalogBatchEvent = function(req,res,next){ listenTo('listenToServiceCatalogBatchEvent', req, res, next); };
exports.listenToServiceCatalogDeleteEvent = function(req,res,next){ listenTo('listenToServiceCatalogDeleteEvent', req, res, next); };
exports.listenToServiceCategoryCreateEvent = function(req,res,next){ listenTo('listenToServiceCategoryCreateEvent', req, res, next); };
exports.listenToServiceCategoryChangeEvent = function(req,res,next){ listenTo('listenToServiceCategoryChangeEvent', req, res, next); };
exports.listenToServiceCategoryDeleteEvent = function(req,res,next){ listenTo('listenToServiceCategoryDeleteEvent', req, res, next); };
exports.listenToServiceCandidateCreateEvent = function(req,res,next){ listenTo('listenToServiceCandidateCreateEvent', req, res, next); };
exports.listenToServiceCandidateChangeEvent = function(req,res,next){ listenTo('listenToServiceCandidateChangeEvent', req, res, next); };
exports.listenToServiceCandidateDeleteEvent = function(req,res,next){ listenTo('listenToServiceCandidateDeleteEvent', req, res, next); };
exports.listenToServiceSpecificationCreateEvent = function(req,res,next){ listenTo('listenToServiceSpecificationCreateEvent', req, res, next); };
exports.listenToServiceSpecificationChangeEvent = function(req,res,next){ listenTo('listenToServiceSpecificationChangeEvent', req, res, next); };
exports.listenToServiceSpecificationDeleteEvent = function(req,res,next){ listenTo('listenToServiceSpecificationDeleteEvent', req, res, next); };
