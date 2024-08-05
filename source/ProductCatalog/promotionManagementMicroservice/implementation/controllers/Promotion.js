'use strict';

var url = require('url');

var Promotion = require('../service/PromotionService');

module.exports.createPromotion = function createPromotion (req, res, next) {
  Promotion.createPromotion(req, res, next);
};

module.exports.deletePromotion = function deletePromotion (req, res, next) {
  Promotion.deletePromotion(req, res, next);
};

module.exports.listPromotion = function listPromotion (req, res, next) {
  Promotion.listPromotion(req, res, next);
};

module.exports.patchPromotion = function patchPromotion (req, res, next) {
  Promotion.patchPromotion(req, res, next);
};

module.exports.retrievePromotion = function retrievePromotion (req, res, next) {
  Promotion.retrievePromotion(req, res, next);
};
