'use strict';
var ServiceLevelSpecification = require('../service/ServiceLevelSpecificationService');

module.exports.createServiceLevelSpecification = function(req, res, next) {
  ServiceLevelSpecification.createServiceLevelSpecification(req, res, next);
};
module.exports.deleteServiceLevelSpecification = function(req, res, next) {
  ServiceLevelSpecification.deleteServiceLevelSpecification(req, res, next);
};
module.exports.listServiceLevelSpecification = function(req, res, next) {
  ServiceLevelSpecification.listServiceLevelSpecification(req, res, next);
};
module.exports.patchServiceLevelSpecification = function(req, res, next) {
  ServiceLevelSpecification.patchServiceLevelSpecification(req, res, next);
};
module.exports.retrieveServiceLevelSpecification = function(req, res, next) {
  ServiceLevelSpecification.retrieveServiceLevelSpecification(req, res, next);
};
