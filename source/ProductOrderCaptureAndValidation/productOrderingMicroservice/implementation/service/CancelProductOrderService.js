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

// for list operations
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

exports.createCancelProductOrder = function(req, res, next) {
  /**
   * Creates a CancelProductOrder
   * This operation creates a CancelProductOrder entity.
   *
   * cancelProductOrder CancelProductOrder_Create The CancelProductOrder to be created
   * returns CancelProductOrder
   **/

  console.log('createCancelProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument cancelProductOrder */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createCancelProductOrder', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createCancelProductOrder', payload))
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
            console.log("createCancelProductOrder: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createCancelProductOrder: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createCancelProductOrder: error=" + error.toString());
      sendError(res, error);
    });

};

exports.listCancelProductOrder = function(req, res, next) {
  /**
   * List or find CancelProductOrder objects
   * This operation list or find CancelProductOrder entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listCancelProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.retrieveCancelProductOrder = function(req, res, next) {
  /**
   * Retrieves a CancelProductOrder by ID
   * This operation retrieves a CancelProductOrder entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the CancelProductOrder
   * fields String Comma-separated properties to provide in response (optional)
   * returns CancelProductOrder
   **/

  console.log('retrieveCancelProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);

};
