'use strict';

var url = require('url');

var CancelProductOrder = require('../service/CancelProductOrderService');

module.exports.createCancelProductOrder = function createCancelProductOrder (req, res, next) {
  CancelProductOrder.createCancelProductOrder(req, res, next);
};

module.exports.listCancelProductOrder = function listCancelProductOrder (req, res, next) {
  CancelProductOrder.listCancelProductOrder(req, res, next);
};

module.exports.retrieveCancelProductOrder = function retrieveCancelProductOrder (req, res, next) {
  CancelProductOrder.retrieveCancelProductOrder(req, res, next);
};
