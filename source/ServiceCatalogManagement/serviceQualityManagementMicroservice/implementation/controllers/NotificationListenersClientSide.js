'use strict';
var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToServiceLevelObjectiveCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceLevelObjectiveCreateEvent(req, res, next);
};
module.exports.listenToServiceLevelObjectiveAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceLevelObjectiveAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToServiceLevelObjectiveDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceLevelObjectiveDeleteEvent(req, res, next);
};
module.exports.listenToServiceLevelSpecificationCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceLevelSpecificationCreateEvent(req, res, next);
};
module.exports.listenToServiceLevelSpecificationAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceLevelSpecificationAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToServiceLevelSpecificationDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceLevelSpecificationDeleteEvent(req, res, next);
};
