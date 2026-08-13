'use strict';
var ServiceTestSpecificationService = require('../service/ServiceTestSpecificationService');

module.exports.listServiceTestSpecification = function(req, res, next) {
  ServiceTestSpecificationService.listServiceTestSpecification(req, res, next);
};
module.exports.createServiceTestSpecification = function(req, res, next) {
  ServiceTestSpecificationService.createServiceTestSpecification(req, res, next);
};
module.exports.retrieveServiceTestSpecification = function(req, res, next) {
  ServiceTestSpecificationService.retrieveServiceTestSpecification(req, res, next);
};
module.exports.patchServiceTestSpecification = function(req, res, next) {
  ServiceTestSpecificationService.patchServiceTestSpecification(req, res, next);
};
module.exports.deleteServiceTestSpecification = function(req, res, next) {
  ServiceTestSpecificationService.deleteServiceTestSpecification(req, res, next);
};
