'use strict';
var url = require('url');
var EventsSubscriptionService = require('../service/EventsSubscriptionService');

module.exports.registerListener = function(req, res, next) {
  EventsSubscriptionService.registerListener(req, res, next);
};
module.exports.unregisterListener = function(req, res, next) {
  EventsSubscriptionService.unregisterListener(req, res, next);
};
