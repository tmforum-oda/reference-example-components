'use strict';
var ServiceLevelObjective = require('../service/ServiceLevelObjectiveService');

module.exports.createServiceLevelObjective = function(req, res, next) {
  ServiceLevelObjective.createServiceLevelObjective(req, res, next);
};
module.exports.deleteServiceLevelObjective = function(req, res, next) {
  ServiceLevelObjective.deleteServiceLevelObjective(req, res, next);
};
module.exports.listServiceLevelObjective = function(req, res, next) {
  ServiceLevelObjective.listServiceLevelObjective(req, res, next);
};
module.exports.patchServiceLevelObjective = function(req, res, next) {
  ServiceLevelObjective.patchServiceLevelObjective(req, res, next);
};
module.exports.retrieveServiceLevelObjective = function(req, res, next) {
  ServiceLevelObjective.retrieveServiceLevelObjective(req, res, next);
};
