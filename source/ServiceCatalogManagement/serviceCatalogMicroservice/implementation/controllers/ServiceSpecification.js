'use strict';
var url = require('url');
var ServiceSpecification = require('../service/ServiceSpecificationService');

module.exports.createServiceSpecification = function(req, res, next) {
  ServiceSpecification.createServiceSpecification(req, res, next);
};
module.exports.deleteServiceSpecification = function(req, res, next) {
  ServiceSpecification.deleteServiceSpecification(req, res, next);
};
module.exports.listServiceSpecification = function(req, res, next) {
  ServiceSpecification.listServiceSpecification(req, res, next);
};
module.exports.patchServiceSpecification = function(req, res, next) {
  ServiceSpecification.patchServiceSpecification(req, res, next);
};
module.exports.retrieveServiceSpecification = function(req, res, next) {
  ServiceSpecification.retrieveServiceSpecification(req, res, next);
};
