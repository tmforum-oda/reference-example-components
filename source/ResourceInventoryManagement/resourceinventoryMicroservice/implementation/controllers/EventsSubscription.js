'use strict';

var ResourceService = require('../service/ResourceService');

module.exports.registerListener = function registerListener(req, res, next) {
  ResourceService.registerListener(req, res, next);
};

module.exports.unregisterListener = function unregisterListener(req, res, next) {
  ResourceService.unregisterListener(req, res, next);
};
