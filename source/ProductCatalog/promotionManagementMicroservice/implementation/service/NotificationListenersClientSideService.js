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

exports.listenToPromotionAttributeValueChangeEvent = function(req, res, next) {
  /**
   * Client listener for entity PromotionAttributeValueChangeEvent
   * Example of a client listener for receiving the notification PromotionAttributeValueChangeEvent
   *
   * data PromotionAttributeValueChangeEvent The event data
   * returns EventSubscription
   **/

  console.log('listenToPromotionAttributeValueChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument notificationListenersClientSide */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'listenToPromotionAttributeValueChangeEvent', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('listenToPromotionAttributeValueChangeEvent', payload))
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
            console.log("listenToPromotionAttributeValueChangeEvent: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("listenToPromotionAttributeValueChangeEvent: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("listenToPromotionAttributeValueChangeEvent: error=" + error.toString());
      sendError(res, error);
    });



};

exports.listenToPromotionCreateEvent = function(req, res, next) {
  /**
   * Client listener for entity PromotionCreateEvent
   * Example of a client listener for receiving the notification PromotionCreateEvent
   *
   * data PromotionCreateEvent The event data
   * returns EventSubscription
   **/

  console.log('listenToPromotionCreateEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument notificationListenersClientSide */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'listenToPromotionCreateEvent', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('listenToPromotionCreateEvent', payload))
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
            console.log("listenToPromotionCreateEvent: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("listenToPromotionCreateEvent: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("listenToPromotionCreateEvent: error=" + error.toString());
      sendError(res, error);
    });



};

exports.listenToPromotionDeleteEvent = function(req, res, next) {
  /**
   * Client listener for entity PromotionDeleteEvent
   * Example of a client listener for receiving the notification PromotionDeleteEvent
   *
   * data PromotionDeleteEvent The event data
   * returns EventSubscription
   **/

  console.log('listenToPromotionDeleteEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument notificationListenersClientSide */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'listenToPromotionDeleteEvent', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('listenToPromotionDeleteEvent', payload))
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
            console.log("listenToPromotionDeleteEvent: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("listenToPromotionDeleteEvent: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("listenToPromotionDeleteEvent: error=" + error.toString());
      sendError(res, error);
    });



};

exports.listenToPromotionStateChangeEvent = function(req, res, next) {
  /**
   * Client listener for entity PromotionStateChangeEvent
   * Example of a client listener for receiving the notification PromotionStateChangeEvent
   *
   * data PromotionStateChangeEvent The event data
   * returns EventSubscription
   **/

  console.log('listenToPromotionStateChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument notificationListenersClientSide */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'listenToPromotionStateChangeEvent', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('listenToPromotionStateChangeEvent', payload))
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
            console.log("listenToPromotionStateChangeEvent: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("listenToPromotionStateChangeEvent: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("listenToPromotionStateChangeEvent: error=" + error.toString());
      sendError(res, error);
    });



};



