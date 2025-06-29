'use strict';

var utils = require('../utils/writer.js');
var EventsSubscription = require('../service/EventsSubscriptionService');

module.exports.createHub = function createHub (req, res, next, body) {
  EventsSubscription.createHub(req, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.hubDelete = function hubDelete (req, res, next, id) {
  EventsSubscription.hubDelete(req, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.hubGet = function hubGet (req, res, next, id) {
  EventsSubscription.hubGet(req, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
