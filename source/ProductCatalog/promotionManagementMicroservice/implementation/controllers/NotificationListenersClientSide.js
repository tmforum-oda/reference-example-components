'use strict';

var url = require('url');

var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToPromotionAttributeValueChangeEvent = function listenToPromotionAttributeValueChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToPromotionAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToPromotionCreateEvent = function listenToPromotionCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToPromotionCreateEvent(req, res, next);
};

module.exports.listenToPromotionDeleteEvent = function listenToPromotionDeleteEvent (req, res, next) {
  NotificationListenersClientSide.listenToPromotionDeleteEvent(req, res, next);
};

module.exports.listenToPromotionStateChangeEvent = function listenToPromotionStateChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToPromotionStateChangeEvent(req, res, next);
};
