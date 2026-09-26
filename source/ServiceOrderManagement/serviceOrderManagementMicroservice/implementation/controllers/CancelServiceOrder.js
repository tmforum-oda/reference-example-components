'use strict';
var url = require('url');
var CancelServiceOrder = require('../service/CancelServiceOrderService');

module.exports.listCancelServiceOrder = function(req, res, next) {
  CancelServiceOrder.listCancelServiceOrder(req, res, next);
};

module.exports.createCancelServiceOrder = function(req, res, next) {
  CancelServiceOrder.createCancelServiceOrder(req, res, next);
};

module.exports.retrieveCancelServiceOrder = function(req, res, next) {
  CancelServiceOrder.retrieveCancelServiceOrder(req, res, next);
};
