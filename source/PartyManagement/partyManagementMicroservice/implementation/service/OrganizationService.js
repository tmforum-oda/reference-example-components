'use strict';

//Minimal Service with filtering (equality match only) and attribute selection
//Error Handing Need to define a global error handler
//Paging and Range based Iterator to be added
//Notification to be added add listener and implement hub

const util = require('util');
const uuid = require('uuid');

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');

// for list operations (including downstream API)
const listResource = require('../utils/listResource').listResource;
const retrieveResource = require('../utils/retrieveResource').retrieveResource;

const {sendDoc} = require('../utils/mongoUtils');

const {setBaseProperties, traverse, 
       addHref, processCommonAttributes } = require('../utils/operationsUtils');

const {validateRequest} = require('../utils/ruleUtils');

const {processAssignmentRules} = require('../utils/operations');

const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');

const {updateQueryServiceType, updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');

const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

exports.createOrganization = function(req, res, next) {
  /**
   * Creates a Organization
   * This operation creates a Organization entity.
   *
   * organization Organization_Create The Organization to be created
   * returns Organization
   **/

  console.log('createOrganization :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument organization */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createOrganization', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createOrganization', payload))
    .then(payload => {

      const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

      payload = swaggerUtils.updatePayloadServiceType(payload, req,'');

      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .insertOne(payload)
          .then(() => {

            payload = cleanPayloadServiceType(payload);

            sendDoc(res, 201, payload);
            notificationUtils.publish(req,payload);
          })
          .catch((error) => {
            console.log("createOrganization: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createOrganization: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createOrganization: error=" + error.toString());
      sendError(res, error);
    });

};

exports.deleteOrganization = function(req, res, next) {
  /**
   * Deletes a Organization
   * This operation deletes a Organization entity.
   *
   * id String Identifier of the Organization
   * no response value expected for this operation
   **/

  console.log('deleteOrganization :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulDestroy */

  const id = String(req.swagger.params.id.value);

  var query = {
    id: id
  };

  query = swaggerUtils.updateQueryServiceType(query, req,'id');

  const resourceType = getResponseType(req); 

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .deleteOne(query)
      .then((doc) => {
        if (doc.result.n == 1) {
           sendDoc(res, 204, {});
        } else {
           sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id found"));
        }
      })
      .catch((error) => {
        console.log("deleteOrganization: error=" + error);
        sendError(res, internalError);
      })
  })
  .catch((error) => {
    console.log("deleteOrganization: error=" + error);
    sendError(res, internalError);
  })
};

exports.listOrganization = function(req, res, next) {
  /**
   * List or find Organization objects
   * This operation list or find Organization entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listOrganization :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulIndex */

  listResource(req, res, next);

};

exports.patchOrganization = function(req, res, next) {
  /**
   * Updates partially a Organization
   * This operation updates partially a Organization entity.
   *
   * id String Identifier of the Organization
   * organization Organization_Update The Organization to be updated
   * returns Organization
   **/

  console.log('patchOrganization :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulPatch */

  const id = String(req.swagger.params.id.value);

  var query = {
    id: id
  };

  query = swaggerUtils.updateQueryServiceType(query, req,'id');
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);
  
  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'patchOrganization', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('patchOrganization', payload))
    .then(payload => {

      payload = swaggerUtils.updatePayloadServiceType(payload, req,'');

      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .updateOne(query, {$set: payload}, {upsert: false})
          .then(() => {
            return db.collection(resourceType).findOne(query);
          })
          .then((updated) => {

            updated = cleanPayloadServiceType(updated);

            sendDoc(res, 200, updated);
            notificationUtils.publish(req,updated);
          })
          .catch((error) => {
            console.log("patchOrganization: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("patchOrganization: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("patchOrganization: error=" + error.toString());
      sendError(res, error);
    });

};

exports.retrieveOrganization = function(req, res, next) {
  /**
   * Retrieves a Organization by ID
   * This operation retrieves a Organization entity.
   *
   * id String Identifier of the Organization
   * fields String Comma-separated properties to provide in response (optional)
   * returns Organization
   **/

  console.log('retrieveOrganization :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulShow */

  retrieveResource(req, res, next);

};
