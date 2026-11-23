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

exports.createCatalog = function(req, res, next) {
  /**
   * Creates a Catalog
   * The v4 payload is stored as a TMF620 v5 resource (issue #87); see utils/resourceOperations.js
   **/

  console.log('createCatalog :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  return createResource(req, res, 'createCatalog');
};

exports.deleteCatalog = function(req, res, next) {
  /**
   * Deletes a Catalog
   * This operation deletes a Catalog entity.
   *
   * id String Identifier of the Catalog
   * no response value expected for this operation
   **/

  console.log('deleteCatalog :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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

exports.listCatalog = async function(req, res, next) {
  /**
   * List or find Catalog objects
   * This operation list or find Catalog entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listCatalog :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.patchCatalog = function(req, res, next) {
  /**
   * Updates partially a Catalog
   * Merged into the stored TMF620 v5 resource, keeping what v4 cannot see (issue #87)
   **/

  console.log('patchCatalog :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  return patchResource(req, res, 'patchCatalog');
};

exports.retrieveCatalog = function(req, res, next) {
  /**
   * Retrieves a Catalog by ID
   * This operation retrieves a Catalog entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the Catalog
   * fields String Comma-separated properties to provide in response (optional)
   * returns Catalog
   **/

  console.log('retrieveCatalog :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);

};



