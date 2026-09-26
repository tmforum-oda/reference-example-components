'use strict';
var EventsSubscription = require('../service/EventsSubscriptionService');

module.exports.registerListener = function(req, res, next) {
  EventsSubscription.registerListener(req, res, next);
};
module.exports.unregisterListener = function(req, res, next) {
  EventsSubscription.unregisterListener(req, res, next);
};
