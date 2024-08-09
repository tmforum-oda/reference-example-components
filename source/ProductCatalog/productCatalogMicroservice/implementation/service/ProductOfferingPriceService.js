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

exports.createProductOfferingPrice = function(req, res, next) {
  /**
   * Creates a ProductOfferingPrice
   * This operation creates a ProductOfferingPrice entity.
   *
   * productOfferingPrice ProductOfferingPrice_Create The ProductOfferingPrice to be created
   * returns ProductOfferingPrice
   **/

  console.log('createProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument productOfferingPrice */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createProductOfferingPrice', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createProductOfferingPrice', payload))
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
            console.log("createProductOfferingPrice: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createProductOfferingPrice: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createProductOfferingPrice: error=" + error.toString());
      sendError(res, error);
    });



};

exports.deleteProductOfferingPrice = function(req, res, next) {
  /**
   * Deletes a ProductOfferingPrice
   * This operation deletes a ProductOfferingPrice entity.
   *
   * id String Identifier of the ProductOfferingPrice
   * no response value expected for this operation
   **/

  console.log('deleteProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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

exports.listProductOfferingPrice = function(req, res, next) {
  /**
   * List or find ProductOfferingPrice objects
   * This operation list or find ProductOfferingPrice entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.patchProductOfferingPrice = function(req, res, next) {
  /**
   * Updates partially a ProductOfferingPrice
   * This operation updates partially a ProductOfferingPrice entity.
   *
   * id String Identifier of the ProductOfferingPrice
   * productOfferingPrice ProductOfferingPrice_Update The ProductOfferingPrice to be updated
   * returns ProductOfferingPrice
   **/

  console.log('patchProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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
    .then(payload => validateRequest(req,'patchProductOfferingPrice',payload))
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
                  console.log("patchProductOfferingPrice error=" + error);
                  return sendError(res, internalError);
                });
            })
            .catch((error) => {
              console.log("patchProductOfferingPrice error=" + error);
              return sendError(res, internalError);
            })
          })
        .catch((error) => {
          console.log("patchProductOfferingPrice error=" + error);
          return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
        });        
      })
      .catch((error) => {
        console.log("patchProductOfferingPrice error=" + error);
        return sendError(res, internalError);
      });
  })
  .catch(error => {
    console.log("patchProductOfferingPrice error=" + error);
    return sendError(res, error);
  });




};

exports.retrieveProductOfferingPrice = function(req, res, next) {
  /**
   * Retrieves a ProductOfferingPrice by ID
   * This operation retrieves a ProductOfferingPrice entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the ProductOfferingPrice
   * fields String Comma-separated properties to provide in response (optional)
   * returns ProductOfferingPrice
   **/

  console.log('retrieveProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);


};



