'use strict';

var utils = require('../utils/writer.js');
var EventsSubscription = require('../service/EventsSubscriptionService');

module.exports.createHub = function createHub (req, res, next, body) {
  EventsSubscription.createHub(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.hubDelete = function hubDelete (req, res, next, id) {
  EventsSubscription.hubDelete(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.hubGet = function hubGet (req, res, next, id) {
  EventsSubscription.hubGet(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
