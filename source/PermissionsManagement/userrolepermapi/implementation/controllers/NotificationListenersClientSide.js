'use strict';
var url = require('url');
var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToPermissionCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToPermissionCreateEvent(req, res, next);
};
module.exports.listenToPermissionAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToPermissionAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToPermissionStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToPermissionStateChangeEvent(req, res, next);
};
module.exports.listenToPermissionDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToPermissionDeleteEvent(req, res, next);
};
module.exports.listenToUserRoleCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToUserRoleCreateEvent(req, res, next);
};
module.exports.listenToUserRoleAttributeValueChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToUserRoleAttributeValueChangeEvent(req, res, next);
};
module.exports.listenToUserRoleStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToUserRoleStateChangeEvent(req, res, next);
};
module.exports.listenToUserRoleDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToUserRoleDeleteEvent(req, res, next);
};
