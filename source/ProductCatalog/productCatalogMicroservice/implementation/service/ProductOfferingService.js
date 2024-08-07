'use strict';

//Minimal Service with filtering (equality match only) and attribute selection
//Error Handing Need to define a global error hqndler
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

exports.createProductOffering = function(req, res, next) {
  /**
   * Creates a ProductOffering
   * This operation creates a ProductOffering entity.
   *
   * productOffering ProductOffering_Create The ProductOffering to be created
   * returns ProductOffering
   **/

  console.log('createProductOffering :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument productOffering */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createProductOffering', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createProductOffering', payload))
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
            console.log("createProductOffering: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createProductOffering: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createProductOffering: error=" + error.toString());
      sendError(res, error);
    });



};

exports.deleteProductOffering = function(req, res, next) {
  /**
   * Deletes a ProductOffering
   * This operation deletes a ProductOffering entity.
   *
   * id String Identifier of the ProductOffering
   * no response value expected for this operation
   **/

  console.log('deleteProductOffering :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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

exports.listProductOffering = function(req, res, next) {
  /**
   * List or find ProductOffering objects
   * This operation list or find ProductOffering entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listProductOffering :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.patchProductOffering = function(req, res, next) {
  /**
   * Updates partially a ProductOffering
   * This operation updates partially a ProductOffering entity.
   *
   * id String Identifier of the ProductOffering
   * productOffering ProductOffering_Update The ProductOffering to be updated
   * returns ProductOffering
   **/

  console.log('patchProductOffering :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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
    .then(payload => validateRequest(req,'patchProductOffering',payload))
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
                  console.log("patchProductOffering error=" + error);
                  return sendError(res, internalError);
                });
            })
            .catch((error) => {
              console.log("patchProductOffering error=" + error);
              return sendError(res, internalError);
            })
          })
        .catch((error) => {
          console.log("patchProductOffering error=" + error);
          return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
        });        
      })
      .catch((error) => {
        console.log("patchProductOffering error=" + error);
        return sendError(res, internalError);
      });
  })
  .catch(error => {
    console.log("patchProductOffering error=" + error);
    return sendError(res, error);
  });




};

exports.retrieveProductOffering = function(req, res, next) {
  /**
   * Retrieves a ProductOffering by ID
   * This operation retrieves a ProductOffering entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the ProductOffering
   * fields String Comma-separated properties to provide in response (optional)
   * returns ProductOffering
   **/

  console.log('retrieveProductOffering :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);



};



