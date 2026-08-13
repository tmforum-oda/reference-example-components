'use strict';
const notificationUtils = require('../utils/notificationUtils');

module.exports.registerListener = function(req, res, next) {
  notificationUtils.register(req, res, next);
};
module.exports.unregisterListener = function(req, res, next) {
  notificationUtils.unregister(req, res, next);
};
