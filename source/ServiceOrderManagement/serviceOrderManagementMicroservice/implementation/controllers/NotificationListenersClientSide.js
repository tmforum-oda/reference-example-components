'use strict';
var url = require('url');
var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToServiceOrderCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderCreateEvent(req, res, next);
};

module.exports.listenToServiceOrderAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToServiceOrderStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderStateChangeEvent(req, res, next);
};

module.exports.listenToServiceOrderDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderDeleteEvent(req, res, next);
};

module.exports.listenToServiceOrderInformationRequiredEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderInformationRequiredEvent(req, res, next);
};

module.exports.listenToServiceOrderMilestoneEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderMilestoneEvent(req, res, next);
};

module.exports.listenToServiceOrderJeopardyEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceOrderJeopardyEvent(req, res, next);
};

module.exports.listenToCancelServiceOrderCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToCancelServiceOrderCreateEvent(req, res, next);
};

module.exports.listenToCancelServiceOrderStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToCancelServiceOrderStateChangeEvent(req, res, next);
};

module.exports.listenToCancelServiceOrderInformationRequiredEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToCancelServiceOrderInformationRequiredEvent(req, res, next);
};
