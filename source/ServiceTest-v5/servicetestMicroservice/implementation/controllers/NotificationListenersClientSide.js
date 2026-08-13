'use strict';
var NotificationListenersClientSideService = require('../service/NotificationListenersClientSideService');

module.exports.listenToServiceTestCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestCreateEvent(req, res, next);
};
module.exports.listenToServiceTestAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToServiceTestStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestStateChangeEvent(req, res, next);
};
module.exports.listenToServiceTestDeleteEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestDeleteEvent(req, res, next);
};
module.exports.listenToServiceTestSpecificationCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestSpecificationCreateEvent(req, res, next);
};
module.exports.listenToServiceTestSpecificationAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestSpecificationAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToServiceTestSpecificationDeleteEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToServiceTestSpecificationDeleteEvent(req, res, next);
};
