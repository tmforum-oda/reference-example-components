'use strict';
var EventsSubscriptionService = require('../service/EventsSubscriptionService');

module.exports.registerListener = function(req, res, next) {
  EventsSubscriptionService.registerListener(req, res, next);
};
module.exports.unregisterListener = function(req, res, next) {
  EventsSubscriptionService.unregisterListener(req, res, next);
};
