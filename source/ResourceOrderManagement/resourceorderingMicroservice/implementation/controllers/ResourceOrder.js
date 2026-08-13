'use strict';
var url = require('url');
var ResourceOrderService = require('../service/ResourceOrderService');

module.exports.listResourceOrder = function(req, res, next) {
  ResourceOrderService.listResourceOrder(req, res, next);
};

module.exports.createResourceOrder = function(req, res, next) {
  ResourceOrderService.createResourceOrder(req, res, next);
};

module.exports.retrieveResourceOrder = function(req, res, next) {
  ResourceOrderService.retrieveResourceOrder(req, res, next);
};

module.exports.patchResourceOrder = function(req, res, next) {
  ResourceOrderService.patchResourceOrder(req, res, next);
};

module.exports.deleteResourceOrder = function(req, res, next) {
  ResourceOrderService.deleteResourceOrder(req, res, next);
};
