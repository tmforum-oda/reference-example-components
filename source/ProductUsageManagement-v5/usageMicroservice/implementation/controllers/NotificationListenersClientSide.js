'use strict';
var url = require('url');
var NotificationListenersClientSideService = require('../service/NotificationListenersClientSideService');

module.exports.listenToUsageCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageCreateEvent(req, res, next);
};
module.exports.listenToUsageAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToUsageDeleteEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageDeleteEvent(req, res, next);
};
module.exports.listenToUsageStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageStateChangeEvent(req, res, next);
};
module.exports.listenToUsageSpecificationCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageSpecificationCreateEvent(req, res, next);
};
module.exports.listenToUsageSpecificationAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageSpecificationAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToUsageSpecificationDeleteEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToUsageSpecificationDeleteEvent(req, res, next);
};
