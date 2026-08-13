'use strict';
var url = require('url');
var NotificationListenersService = require('../service/NotificationListenersService');

module.exports.listenToResourceOrderCreateEvent = function(req, res, next) {
  NotificationListenersService.listenToResourceOrderCreateEvent(req, res, next);
};

module.exports.listenToResourceOrderAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersService.listenToResourceOrderAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToResourceOrderDeleteEvent = function(req, res, next) {
  NotificationListenersService.listenToResourceOrderDeleteEvent(req, res, next);
};

module.exports.listenToResourceOrderStateChangeEvent = function(req, res, next) {
  NotificationListenersService.listenToResourceOrderStateChangeEvent(req, res, next);
};

module.exports.listenToResourceOrderInformationRequiredEvent = function(req, res, next) {
  NotificationListenersService.listenToResourceOrderInformationRequiredEvent(req, res, next);
};

module.exports.listenToCancelResourceOrderCreateEvent = function(req, res, next) {
  NotificationListenersService.listenToCancelResourceOrderCreateEvent(req, res, next);
};

module.exports.listenToCancelResourceOrderStateChangeEvent = function(req, res, next) {
  NotificationListenersService.listenToCancelResourceOrderStateChangeEvent(req, res, next);
};

module.exports.listenToCancelResourceOrderInformationRequiredEvent = function(req, res, next) {
  NotificationListenersService.listenToCancelResourceOrderInformationRequiredEvent(req, res, next);
};
