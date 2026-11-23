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

const {createResource, patchResource} = require('../utils/resourceOperations');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

exports.createProductOfferingPrice = function(req, res, next) {
  /**
   * Creates a ProductOfferingPrice
   * The v4 payload is stored as a TMF620 v5 resource (issue #87); see utils/resourceOperations.js
   **/

  console.log('createProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  return createResource(req, res, 'createProductOfferingPrice');
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
   * Merged into the stored TMF620 v5 resource, keeping what v4 cannot see (issue #87)
   **/

  console.log('patchProductOfferingPrice :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  return patchResource(req, res, 'patchProductOfferingPrice');
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



