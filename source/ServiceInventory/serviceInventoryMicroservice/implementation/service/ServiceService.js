'use strict';

//Minimal Service with filtering (equality match only) and attribute selection
//Error Handling Need to define a global error handler
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

exports.createService = function(req, res, next) {
  /**
   * Creates a Service
   * This operation creates a Service entity.
   *
   * service Service_Create The Service to be created
   * returns Service
   **/

  console.log('createService :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument service */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createService', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createService', payload))
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
            console.log("createService: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createService: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createService: error=" + error.toString());
      sendError(res, error);
    });

};

exports.deleteService = function(req, res, next) {
  /**
   * Deletes a Service
   * This operation deletes a Service entity.
   *
   * id String Identifier of the Service
   * no response value expected for this operation
   **/

  console.log('deleteService :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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
      .then(doc => {
        if (doc.result.n == 1) {
           sendDoc(res, 204, {});
           notificationUtils.publish(req,doc);
        } else { 
           sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id found"));
        }
      }).catch(error => sendError(res, internalError))
  })
  .catch(error => sendError(res, internalError));

};

exports.listService = async function(req, res, next) {
  /**
   * List or find Service objects
   * This operation list or find Service entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listService :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.patchService = function(req, res, next) {
  /**
   * Updates partially a Service
   * This operation updates partially a Service entity.
   *
   * id String Identifier of the Service
   * service Service_Update The Service to be updated
   * returns Service
   **/

  console.log('patchService :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulPatch */

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to update resource");

  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  const id = String(req.swagger.params.id.value);
  var query = {
   id: id
  };

  query = swaggerUtils.updateQueryServiceType(query, req, 'id');

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req,'patchService',payload))
    .then(payload => traverse(req,requestSchema,payload,[],getPayloadType(req)))
    .then(payload => {

      mongoUtils.connect().then(db => {
        // first check if resource exists
        db.collection(resourceType)
        .findOne(query)
        .then(old => {
          if (old==undefined) {
            return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
          }

          payload = swaggerUtils.updatePayloadServiceType(payload, req, 'id');
          
          // then update and return the complete resource
          db.collection(resourceType)
            .updateOne(query, {$set: payload}, {upsert: false})
            .then(() => {
              db.collection(resourceType).findOne(query)
                .then((doc) => {

                  doc = swaggerUtils.cleanPayloadServiceType(doc);

                  sendDoc(res, 201, doc);
                  notificationUtils.publish(req,doc,old);
                })
                .catch((error) => {
                  console.log("patchService error=" + error);
                  return sendError(res, internalError);
                });
            })
            .catch((error) => {
              console.log("patchService error=" + error);
              return sendError(res, internalError);
            })
          })
        .catch((error) => {
          console.log("patchService error=" + error);
          return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
        });        
      })
      .catch((error) => {
        console.log("patchService error=" + error);
        return sendError(res, internalError);
      });
  })
  .catch(error => {
    console.log("patchService error=" + error);
    return sendError(res, error);
  });

};

exports.retrieveService = function(req, res, next) {
  /**
   * Retrieves a Service by ID
   * This operation retrieves a Service entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the Service
   * fields String Comma-separated properties to provide in response (optional)
   * returns Service
   **/

  console.log('retrieveService :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);

};

exports.registerListener = function(req, res, next) {
  /**
   * Register a listener
   * Sets the communication endpoint address the service instance must use to deliver
   * information about its health state, execution state, failures and metrics.
   *
   * data EventSubscriptionInput Data containing the callback endpoint to deliver the information
   * returns EventSubscription
   **/

  console.log('registerListener :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching tmfHub & isRestfulCreate */
  notificationUtils.register(req, res, next);

};

exports.unregisterListener = function(req, res, next) {
  /**
   * Unregister a listener
   * Resets the communication endpoint address the service instance must use to deliver
   * information about its health state, execution state, failures and metrics.
   *
   * id String The id of the registered listener
   * no response value expected for this operation
   **/

  console.log('unregisterListener :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching tmfHub & isRestfulDestroy */
  notificationUtils.unregister(req, res, next);

};

exports.listenToServiceCreateEvent = function(req, res, next) {
  /**
   * Client listener for entity ServiceCreateEvent
   **/
  console.log('listenToServiceCreateEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process event");
  sendDoc(res, 201, {});
};

exports.listenToServiceAttributeValueChangeEvent = function(req, res, next) {
  /**
   * Client listener for entity ServiceAttributeValueChangeEvent
   **/
  console.log('listenToServiceAttributeValueChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process event");
  sendDoc(res, 201, {});
};

exports.listenToServiceStateChangeEvent = function(req, res, next) {
  /**
   * Client listener for entity ServiceStateChangeEvent
   **/
  console.log('listenToServiceStateChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process event");
  sendDoc(res, 201, {});
};

exports.listenToServiceDeleteEvent = function(req, res, next) {
  /**
   * Client listener for entity ServiceDeleteEvent
   **/
  console.log('listenToServiceDeleteEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process event");
  sendDoc(res, 201, {});
};
