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

exports.createProductSpecification = function(req, res, next) {
  /**
   * Creates a ProductSpecification
   * The v4 payload is stored as a TMF620 v5 resource (issue #87); see utils/resourceOperations.js
   **/

  console.log('createProductSpecification :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  return createResource(req, res, 'createProductSpecification');
};

exports.deleteProductSpecification = function(req, res, next) {
  /**
   * Deletes a ProductSpecification
   * This operation deletes a ProductSpecification entity.
   *
   * id String Identifier of the ProductSpecification
   * no response value expected for this operation
   **/

  console.log('deleteProductSpecification :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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

exports.listProductSpecification = function(req, res, next) {
  /**
   * List or find ProductSpecification objects
   * This operation list or find ProductSpecification entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listProductSpecification :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.patchProductSpecification = function(req, res, next) {
  /**
   * Updates partially a ProductSpecification
   * Merged into the stored TMF620 v5 resource, keeping what v4 cannot see (issue #87)
   **/

  console.log('patchProductSpecification :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  return patchResource(req, res, 'patchProductSpecification');
};

exports.retrieveProductSpecification = function(req, res, next) {
  /**
   * Retrieves a ProductSpecification by ID
   * This operation retrieves a ProductSpecification entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the ProductSpecification
   * fields String Comma-separated properties to provide in response (optional)
   * returns ProductSpecification
   **/

  console.log('retrieveProductSpecification :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);

};



