'use strict';

var url = require('url');

var ProductOrder = require('../service/ProductOrderService');

module.exports.createProductOrder = function createProductOrder (req, res, next) {
  ProductOrder.createProductOrder(req, res, next);
};

module.exports.deleteProductOrder = function deleteProductOrder (req, res, next) {
  ProductOrder.deleteProductOrder(req, res, next);
};

module.exports.listProductOrder = function listProductOrder (req, res, next) {
  ProductOrder.listProductOrder(req, res, next);
};

module.exports.patchProductOrder = function patchProductOrder (req, res, next) {
  ProductOrder.patchProductOrder(req, res, next);
};

module.exports.retrieveProductOrder = function retrieveProductOrder (req, res, next) {
  ProductOrder.retrieveProductOrder(req, res, next);
};
