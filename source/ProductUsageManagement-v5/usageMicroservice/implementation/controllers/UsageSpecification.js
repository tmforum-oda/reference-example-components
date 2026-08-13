'use strict';
var url = require('url');
var UsageSpecificationService = require('../service/UsageSpecificationService');

module.exports.createUsageSpecification = function(req, res, next) {
  UsageSpecificationService.createUsageSpecification(req, res, next);
};
module.exports.deleteUsageSpecification = function(req, res, next) {
  UsageSpecificationService.deleteUsageSpecification(req, res, next);
};
module.exports.listUsageSpecification = function(req, res, next) {
  UsageSpecificationService.listUsageSpecification(req, res, next);
};
module.exports.patchUsageSpecification = function(req, res, next) {
  UsageSpecificationService.patchUsageSpecification(req, res, next);
};
module.exports.retrieveUsageSpecification = function(req, res, next) {
  UsageSpecificationService.retrieveUsageSpecification(req, res, next);
};
