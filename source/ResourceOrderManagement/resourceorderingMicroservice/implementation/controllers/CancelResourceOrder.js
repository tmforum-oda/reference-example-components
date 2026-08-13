'use strict';
var url = require('url');
var CancelResourceOrderService = require('../service/CancelResourceOrderService');

module.exports.listCancelResourceOrder = function(req, res, next) {
  CancelResourceOrderService.listCancelResourceOrder(req, res, next);
};

module.exports.createCancelResourceOrder = function(req, res, next) {
  CancelResourceOrderService.createCancelResourceOrder(req, res, next);
};

module.exports.retrieveCancelResourceOrder = function(req, res, next) {
  CancelResourceOrderService.retrieveCancelResourceOrder(req, res, next);
};
