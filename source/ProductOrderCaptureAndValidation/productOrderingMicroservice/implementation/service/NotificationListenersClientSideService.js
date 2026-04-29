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

exports.listenToProductOrderCreateEvent = function(req, res, next) {
  console.log('listenToProductOrderCreateEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToProductOrderAttributeValueChangeEvent = function(req, res, next) {
  console.log('listenToProductOrderAttributeValueChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToProductOrderDeleteEvent = function(req, res, next) {
  console.log('listenToProductOrderDeleteEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToProductOrderStateChangeEvent = function(req, res, next) {
  console.log('listenToProductOrderStateChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToProductOrderInformationRequiredEvent = function(req, res, next) {
  console.log('listenToProductOrderInformationRequiredEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToCancelProductOrderCreateEvent = function(req, res, next) {
  console.log('listenToCancelProductOrderCreateEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToCancelProductOrderStateChangeEvent = function(req, res, next) {
  console.log('listenToCancelProductOrderStateChangeEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};

exports.listenToCancelProductOrderInformationRequiredEvent = function(req, res, next) {
  console.log('listenToCancelProductOrderInformationRequiredEvent :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
  let doc = {};
  sendDoc(res, 200, doc);
};
