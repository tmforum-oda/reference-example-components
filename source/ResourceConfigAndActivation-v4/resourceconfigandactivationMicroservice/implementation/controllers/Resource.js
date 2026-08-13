'use strict';
var ResourceService = require('../service/ResourceService');

module.exports.listResource = function(req, res, next) {
  ResourceService.listResource(req, res, next);
};
module.exports.createResource = function(req, res, next) {
  ResourceService.createResource(req, res, next);
};
module.exports.retrieveResource = function(req, res, next) {
  ResourceService.retrieveResource(req, res, next);
};
module.exports.patchResource = function(req, res, next) {
  ResourceService.patchResource(req, res, next);
};
module.exports.deleteResource = function(req, res, next) {
  ResourceService.deleteResource(req, res, next);
};
