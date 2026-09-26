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

exports.createIndividual = function(req, res, next) {
  /**
   * Creates a Individual
   * This operation creates a Individual entity.
   *
   * individual Individual_Create The Individual to be created
   * returns Individual
   **/

  console.log('createIndividual :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument individual */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createIndividual', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createIndividual', payload))
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
            console.log("createIndividual: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createIndividual: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createIndividual: error=" + error.toString());
      sendError(res, error);
    });

};

exports.deleteIndividual = function(req, res, next) {
  /**
   * Deletes a Individual
   * This operation deletes a Individual entity.
   *
   * id String Identifier of the Individual
   * no response value expected for this operation
   **/

  console.log('deleteIndividual :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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
        console.log("deleteIndividual: error=" + error);
        sendError(res, internalError);
      })
  })
  .catch((error) => {
    console.log("deleteIndividual: error=" + error);
    sendError(res, internalError);
  })
};

exports.listIndividual = function(req, res, next) {
  /**
   * List or find Individual objects
   * This operation list or find Individual entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listIndividual :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulIndex */

  listResource(req, res, next);

};

exports.patchIndividual = function(req, res, next) {
  /**
   * Updates partially a Individual
   * This operation updates partially a Individual entity.
   *
   * id String Identifier of the Individual
   * individual Individual_Update The Individual to be updated
   * returns Individual
   **/

  console.log('patchIndividual :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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
    .then(payload => validateRequest(req, 'patchIndividual', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('patchIndividual', payload))
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
            console.log("patchIndividual: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("patchIndividual: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("patchIndividual: error=" + error.toString());
      sendError(res, error);
    });

};

exports.retrieveIndividual = function(req, res, next) {
  /**
   * Retrieves a Individual by ID
   * This operation retrieves a Individual entity.
   *
   * id String Identifier of the Individual
   * fields String Comma-separated properties to provide in response (optional)
   * returns Individual
   **/

  console.log('retrieveIndividual :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulShow */

  retrieveResource(req, res, next);

};
