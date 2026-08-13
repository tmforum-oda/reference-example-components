'use strict';
var ServiceTestService = require('../service/ServiceTestService');

module.exports.listServiceTest = function(req, res, next) {
  ServiceTestService.listServiceTest(req, res, next);
};
module.exports.createServiceTest = function(req, res, next) {
  ServiceTestService.createServiceTest(req, res, next);
};
module.exports.retrieveServiceTest = function(req, res, next) {
  ServiceTestService.retrieveServiceTest(req, res, next);
};
module.exports.patchServiceTest = function(req, res, next) {
  ServiceTestService.patchServiceTest(req, res, next);
};
module.exports.deleteServiceTest = function(req, res, next) {
  ServiceTestService.deleteServiceTest(req, res, next);
};
