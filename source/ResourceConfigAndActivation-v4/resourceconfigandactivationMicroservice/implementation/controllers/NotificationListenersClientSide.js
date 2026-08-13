'use strict';
var NotificationListenersClientSideService = require('../service/NotificationListenersClientSideService');

module.exports.listenToResourceCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToResourceCreateEvent(req, res, next);
};
module.exports.listenToResourceAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToResourceAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToResourceStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToResourceStateChangeEvent(req, res, next);
};
module.exports.listenToResourceDeleteEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToResourceDeleteEvent(req, res, next);
};
module.exports.listenToMonitorCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToMonitorCreateEvent(req, res, next);
};
module.exports.listenToMonitorAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToMonitorAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToMonitorStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToMonitorStateChangeEvent(req, res, next);
};
module.exports.listenToMonitorDeleteEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToMonitorDeleteEvent(req, res, next);
};
