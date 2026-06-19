'use strict';
const notificationUtils = require('../utils/notificationUtils');
exports.registerListener   = function(req, res, next) { notificationUtils.register(req, res, next); };
exports.unregisterListener = function(req, res, next) { notificationUtils.unregister(req, res, next); };
