'use strict';

const {sendDoc} = require('../utils/mongoUtils');

function notifyEvent(req, res, next) {
  console.log('Received notification event: ' + req.url);
  const response = { id: '1', callback: req.body ? req.body.callback : '' };
  sendDoc(res, 201, response);
}

exports.listenToServiceOrderCreateEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToServiceOrderAttributeValueChangeEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToServiceOrderStateChangeEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToServiceOrderDeleteEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToServiceOrderInformationRequiredEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToServiceOrderMilestoneEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToServiceOrderJeopardyEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToCancelServiceOrderCreateEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToCancelServiceOrderStateChangeEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};

exports.listenToCancelServiceOrderInformationRequiredEvent = function(req, res, next) {
  notifyEvent(req, res, next);
};
