'use strict';
var url = require('url');
var ServiceOrder = require('../service/ServiceOrderService');

module.exports.listServiceOrder = function(req, res, next) {
  ServiceOrder.listServiceOrder(req, res, next);
};

module.exports.createServiceOrder = function(req, res, next) {
  ServiceOrder.createServiceOrder(req, res, next);
};

module.exports.retrieveServiceOrder = function(req, res, next) {
  ServiceOrder.retrieveServiceOrder(req, res, next);
};

module.exports.patchServiceOrder = function(req, res, next) {
  ServiceOrder.patchServiceOrder(req, res, next);
};

module.exports.deleteServiceOrder = function(req, res, next) {
  ServiceOrder.deleteServiceOrder(req, res, next);
};
