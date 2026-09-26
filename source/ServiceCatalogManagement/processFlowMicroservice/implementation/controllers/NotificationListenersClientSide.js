'use strict';
var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToProcessFlowCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToProcessFlowCreateEvent(req, res, next);
};
module.exports.listenToProcessFlowStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToProcessFlowStateChangeEvent(req, res, next);
};
module.exports.listenToProcessFlowDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToProcessFlowDeleteEvent(req, res, next);
};
module.exports.listenToProcessFlowAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToProcessFlowAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToTaskFlowCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToTaskFlowCreateEvent(req, res, next);
};
module.exports.listenToTaskFlowStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToTaskFlowStateChangeEvent(req, res, next);
};
module.exports.listenToTaskFlowDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToTaskFlowDeleteEvent(req, res, next);
};
module.exports.listenToTaskFlowAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToTaskFlowAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToTaskFlowInformationRequiredEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToTaskFlowInformationRequiredEvent(req, res, next);
};
