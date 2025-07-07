'use strict';

var utils = require('../utils/writer.js');
var NotificationListener = require('../service/NotificationListenerService');

module.exports.permissionSpecificationSetAttributeValueChangeEvent = function permissionSpecificationSetAttributeValueChangeEvent (req, res, next, body) {
  NotificationListener.permissionSpecificationSetAttributeValueChangeEvent(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.permissionSpecificationSetCreateEvent = function permissionSpecificationSetCreateEvent (req, res, next, body) {
  NotificationListener.permissionSpecificationSetCreateEvent(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.permissionSpecificationSetDeleteEvent = function permissionSpecificationSetDeleteEvent (req, res, next, body) {
  NotificationListener.permissionSpecificationSetDeleteEvent(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
