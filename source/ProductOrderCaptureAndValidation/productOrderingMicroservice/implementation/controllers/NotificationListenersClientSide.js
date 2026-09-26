'use strict';

var url = require('url');

var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToProductOrderCreateEvent = function listenToProductOrderCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToProductOrderCreateEvent(req, res, next);
};

module.exports.listenToProductOrderAttributeValueChangeEvent = function listenToProductOrderAttributeValueChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToProductOrderAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToProductOrderDeleteEvent = function listenToProductOrderDeleteEvent (req, res, next) {
  NotificationListenersClientSide.listenToProductOrderDeleteEvent(req, res, next);
};

module.exports.listenToProductOrderStateChangeEvent = function listenToProductOrderStateChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToProductOrderStateChangeEvent(req, res, next);
};

module.exports.listenToProductOrderInformationRequiredEvent = function listenToProductOrderInformationRequiredEvent (req, res, next) {
  NotificationListenersClientSide.listenToProductOrderInformationRequiredEvent(req, res, next);
};

module.exports.listenToCancelProductOrderCreateEvent = function listenToCancelProductOrderCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToCancelProductOrderCreateEvent(req, res, next);
};

module.exports.listenToCancelProductOrderStateChangeEvent = function listenToCancelProductOrderStateChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToCancelProductOrderStateChangeEvent(req, res, next);
};

module.exports.listenToCancelProductOrderInformationRequiredEvent = function listenToCancelProductOrderInformationRequiredEvent (req, res, next) {
  NotificationListenersClientSide.listenToCancelProductOrderInformationRequiredEvent(req, res, next);
};
