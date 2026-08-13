'use strict';

var ResourceService = require('../service/ResourceService');

module.exports.listResource = function listResource(req, res, next) {
  ResourceService.listResource(req, res, next);
};

module.exports.createResource = function createResource(req, res, next) {
  ResourceService.createResource(req, res, next);
};

module.exports.retrieveResource = function retrieveResource(req, res, next) {
  ResourceService.retrieveResource(req, res, next);
};

module.exports.patchResource = function patchResource(req, res, next) {
  ResourceService.patchResource(req, res, next);
};

module.exports.deleteResource = function deleteResource(req, res, next) {
  ResourceService.deleteResource(req, res, next);
};
