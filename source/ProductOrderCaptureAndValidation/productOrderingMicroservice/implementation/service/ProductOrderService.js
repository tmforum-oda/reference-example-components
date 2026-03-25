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

// for downstream dependent API calls
const { retrieveFromDownstreamAPI, createInDownstreamAPI } = require('../utils/downstreamAPI');

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

exports.createProductOrder = function(req, res, next) {
  /**
   * Creates a ProductOrder
   * This operation creates a ProductOrder entity.
   * Validates that all referenced product offerings exist in the Product Catalog,
   * then creates corresponding products in the Product Inventory.
   *
   * productOrder ProductOrder_Create The ProductOrder to be created
   * returns ProductOrder
   **/

  console.log('createProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument productOrder */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createProductOrder', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createProductOrder', payload))
    .then(async payload => {

      const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

      payload = swaggerUtils.updatePayloadServiceType(payload, req,'');

      // --- Business Logic: Validate product offerings against the Product Catalog ---
      const orderItems = payload.productOrderItem || [];
      const invalidOfferings = [];

      for (const item of orderItems) {
        if (item.productOffering && item.productOffering.id) {
          const offeringId = item.productOffering.id;
          console.log('createProductOrder :: validating productOffering ' + offeringId + ' against Product Catalog');
          
          const offering = await retrieveFromDownstreamAPI('downstreamproductcatalog', 'productOffering', offeringId);
          if (!offering) {
            invalidOfferings.push(offeringId);
          }
        }
      }

      if (invalidOfferings.length > 0) {
        const errorMsg = 'The following product offering(s) were not found in the Product Catalog: ' + invalidOfferings.join(', ');
        console.log('createProductOrder :: validation failed - ' + errorMsg);
        sendError(res, new TError(TErrorEnum.UNPROCESSABLE_ENTITY, errorMsg));
        return;
      }

      // Set initial order state
      payload.state = 'acknowledged';
      payload.orderDate = new Date().toISOString();

      // Persist the order to MongoDB
      try {
        const db = await mongoUtils.connect();
        await db.collection(resourceType).insertOne(payload);

        // --- Business Logic: Create products in Product Inventory for each order item ---
        for (const item of orderItems) {
          if (item.action === 'add' && item.productOffering) {
            const productPayload = {
              name: item.productOffering.name || 'Product from order ' + payload.id,
              status: 'created',
              isBundle: false,
              isCustomerVisible: true,
              orderDate: payload.orderDate,
              startDate: new Date().toISOString(),
              productOffering: {
                id: item.productOffering.id,
                href: item.productOffering.href,
                name: item.productOffering.name
              },
              productOrderItem: [{
                orderItemId: item.id,
                productOrderId: payload.id,
                orderItemAction: item.action
              }],
              productCharacteristic: (item.product && item.product.productCharacteristic) || [],
              relatedParty: payload.relatedParty || []
            };

            console.log('createProductOrder :: creating product in Product Inventory for orderItem ' + item.id);
            try {
              const createdProduct = await createInDownstreamAPI('downstreamproductinventory', 'product', productPayload);
              if (createdProduct) {
                console.log('createProductOrder :: product created in inventory with id ' + createdProduct.id);
                // Store reference back to the created product on the order item
                item.product = item.product || {};
                item.product.id = createdProduct.id;
                item.product.href = createdProduct.href;
              }
            } catch (inventoryError) {
              console.log('createProductOrder :: warning - failed to create product in inventory for orderItem ' + item.id);
              console.log(inventoryError.message || inventoryError);
            }
          }
        }

        // Update the order with product references after inventory creation
        await db.collection(resourceType).updateOne({id: payload.id}, {$set: payload});

        payload = cleanPayloadServiceType(payload);
        sendDoc(res, 201, payload);
        notificationUtils.publish(req, payload);
      } catch (error) {
        console.log("createProductOrder: error=" + error);
        sendError(res, internalError);
      }
    })
    .catch( error => {
      console.log("createProductOrder: error=" + error.toString());
      sendError(res, error);
    });

};

exports.deleteProductOrder = function(req, res, next) {
  /**
   * Deletes a ProductOrder
   * This operation deletes a ProductOrder entity.
   *
   * id String Identifier of the ProductOrder
   * no response value expected for this operation
   **/

  console.log('deleteProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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

exports.listProductOrder = function(req, res, next) {
  /**
   * List or find ProductOrder objects
   * This operation list or find ProductOrder entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  listResource(req, res);

};

exports.patchProductOrder = function(req, res, next) {
  /**
   * Updates partially a ProductOrder
   * This operation updates partially a ProductOrder entity.
   *
   * id String Identifier of the ProductOrder
   * productOrder ProductOrder_Update The ProductOrder to be updated
   * returns ProductOrder
   **/

  console.log('patchProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

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
    .then(payload => validateRequest(req,'patchProductOrder',payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => {

      payload = swaggerUtils.updatePayloadServiceType(payload, req,'');

      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .updateOne(query, {$set: payload})
          .then(resp => {

            if(resp.result!=undefined && resp.result.n==1) {
              db.collection(resourceType).findOne(query)
                .then((doc) => {

                  doc = cleanPayloadServiceType(doc);

                  sendDoc(res, 200, doc);
                  notificationUtils.publish(req,doc);
                })
                .catch((error) => {
                  console.log("patchProductOrder error=" + error);
                  sendError(res, internalError);
                });
            } else {
              sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
            }
          })
          .catch((error) => {
            console.log("patchProductOrder error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("patchProductOrder error=" + error);
        sendError(res, internalError);
      })    
    })
    .catch(error => {
      console.log("patchProductOrder error=" + error);
      sendError(res, error);
    });

};

exports.retrieveProductOrder = function(req, res, next) {
  /**
   * Retrieves a ProductOrder by ID
   * This operation retrieves a ProductOrder entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the ProductOrder
   * fields String Comma-separated properties to provide in response (optional)
   * returns ProductOrder
   **/

  console.log('retrieveProductOrder :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  retrieveResource(req, res);

};
