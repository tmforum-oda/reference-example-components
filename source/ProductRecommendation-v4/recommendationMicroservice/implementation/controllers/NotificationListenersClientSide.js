'use strict';
var NotificationListenersClientSideService = require('../service/NotificationListenersClientSideService');

module.exports.listenToQueryProductRecommendationCreateEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToQueryProductRecommendationCreateEvent(req, res, next);
};
module.exports.listenToQueryProductRecommendationStateChangeEvent = function(req, res, next) {
  NotificationListenersClientSideService.listenToQueryProductRecommendationStateChangeEvent(req, res, next);
};
