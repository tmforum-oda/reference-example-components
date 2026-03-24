'use strict';

var url = require('url');

var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToOrganizationCreateEvent = function listenToOrganizationCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToOrganizationCreateEvent(req, res, next);
};

module.exports.listenToOrganizationAttributeValueChangeEvent = function listenToOrganizationAttributeValueChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToOrganizationAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToOrganizationStateChangeEvent = function listenToOrganizationStateChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToOrganizationStateChangeEvent(req, res, next);
};

module.exports.listenToOrganizationDeleteEvent = function listenToOrganizationDeleteEvent (req, res, next) {
  NotificationListenersClientSide.listenToOrganizationDeleteEvent(req, res, next);
};

module.exports.listenToIndividualCreateEvent = function listenToIndividualCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToIndividualCreateEvent(req, res, next);
};

module.exports.listenToIndividualAttributeValueChangeEvent = function listenToIndividualAttributeValueChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToIndividualAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToIndividualStateChangeEvent = function listenToIndividualStateChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToIndividualStateChangeEvent(req, res, next);
};

module.exports.listenToIndividualDeleteEvent = function listenToIndividualDeleteEvent (req, res, next) {
  NotificationListenersClientSide.listenToIndividualDeleteEvent(req, res, next);
};
