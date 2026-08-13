'use strict';
var url = require('url');
var UsageService = require('../service/UsageService');

module.exports.createUsage = function(req, res, next) {
  UsageService.createUsage(req, res, next);
};
module.exports.deleteUsage = function(req, res, next) {
  UsageService.deleteUsage(req, res, next);
};
module.exports.listUsage = function(req, res, next) {
  UsageService.listUsage(req, res, next);
};
module.exports.patchUsage = function(req, res, next) {
  UsageService.patchUsage(req, res, next);
};
module.exports.retrieveUsage = function(req, res, next) {
  UsageService.retrieveUsage(req, res, next);
};
