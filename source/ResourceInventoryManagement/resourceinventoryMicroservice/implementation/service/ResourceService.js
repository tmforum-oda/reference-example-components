'use strict';

const util = require('util');
const uuid = require('uuid');

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');

const listResource = require('../utils/listResource').listResource;
const retrieveResource = require('../utils/retrieveResource').retrieveResource;

const {sendDoc} = require('../utils/mongoUtils');

const {setBaseProperties, traverse,
       addHref, processCommonAttributes} = require('../utils/operationsUtils');

const {validateRequest} = require('../utils/ruleUtils');
const {validateResourceSpecificationHref} = require('../utils/ruleUtils');

const {processAssignmentRules} = require('../utils/operations');

const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');

const {updateQueryServiceType, updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');

const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

exports.createResource = function(req, res, next) {
  console.log('createResource :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createResource', payload))
    .then(payload => validateResourceSpecificationHref(payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createResource', payload))
    .then(payload => {

      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

      payload = swaggerUtils.updatePayloadServiceType(payload, req, '');

      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .insertOne(payload)
          .then(() => {
            payload = cleanPayloadServiceType(payload);
            sendDoc(res, 201, payload);
            notificationUtils.publish(req, payload);
          })
          .catch((error) => {
            console.log("createResource: error=" + error);
            sendError(res, internalError);
          });
      })
      .catch((error) => {
        console.log("createResource: error=" + error);
        sendError(res, internalError);
      });
    })
    .catch(error => {
      console.log("createResource: error=" + error.toString());
      sendError(res, error);
    });
};

exports.deleteResource = function(req, res, next) {
  console.log('deleteResource :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  const id = String(req.swagger.params.id.value);
  var query = { id: id };
  query = swaggerUtils.updateQueryServiceType(query, req, 'id');

  const resourceType = getResponseType(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .deleteOne(query)
      .then(doc => {
        if (doc.result.n == 1) {
          sendDoc(res, 204, {});
          notificationUtils.publish(req, doc);
        } else {
          sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
        }
      }).catch(error => sendError(res, internalError));
  })
  .catch(error => sendError(res, internalError));
};

exports.listResource = async function(req, res, next) {
  console.log('listResource :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);
};

exports.patchResource = function(req, res, next) {
  console.log('patchResource :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to update resource");

  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  const id = String(req.swagger.params.id.value);
  var query = { id: id };
  query = swaggerUtils.updateQueryServiceType(query, req, 'id');

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'patchResource', payload))
    .then(payload => traverse(req, requestSchema, payload, [], getPayloadType(req)))
    .then(payload => {
      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .findOne(query)
          .then(old => {
            if (old == undefined) {
              return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id"));
            }

            payload = swaggerUtils.updatePayloadServiceType(payload, req, 'id');

            db.collection(resourceType)
              .updateOne(query, {$set: payload}, {upsert: false})
              .then(() => {
                db.collection(resourceType).findOne(query)
                  .then((doc) => {
                    doc = swaggerUtils.cleanPayloadServiceType(doc);
                    sendDoc(res, 201, doc);
                    notificationUtils.publish(req, doc, old);
                  })
                  .catch((error) => {
                    console.log("patchResource error=" + error);
                    return sendError(res, internalError);
                  });
              })
              .catch((error) => {
                console.log("patchResource error=" + error);
                return sendError(res, internalError);
              });
          })
          .catch((error) => {
            console.log("patchResource error=" + error);
            return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id"));
          });
      })
      .catch((error) => {
        console.log("patchResource error=" + error);
        return sendError(res, internalError);
      });
    })
    .catch(error => {
      console.log("patchResource error=" + error);
      return sendError(res, error);
    });
};

exports.retrieveResource = function(req, res, next) {
  console.log('retrieveResource :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);
};

exports.registerListener = function(req, res, next) {
  console.log('registerListener :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  notificationUtils.register(req, res, next);
};

exports.unregisterListener = function(req, res, next) {
  console.log('unregisterListener :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  notificationUtils.unregister(req, res, next);
};

exports.listenToResourceCreateEvent = function(req, res, next) {
  console.log('listenToResourceCreateEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  sendDoc(res, 201, {});
};

exports.listenToResourceAttributeValueChangeEvent = function(req, res, next) {
  console.log('listenToResourceAttributeValueChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  sendDoc(res, 201, {});
};

exports.listenToResourceStateChangeEvent = function(req, res, next) {
  console.log('listenToResourceStateChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  sendDoc(res, 201, {});
};

exports.listenToResourceDeleteEvent = function(req, res, next) {
  console.log('listenToResourceDeleteEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  sendDoc(res, 201, {});
};
