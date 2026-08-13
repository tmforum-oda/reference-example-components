'use strict';
var QueryProductRecommendationService = require('../service/QueryProductRecommendationService');

module.exports.listQueryProductRecommendation = function(req, res, next) {
  QueryProductRecommendationService.listQueryProductRecommendation(req, res, next);
};
module.exports.createQueryProductRecommendation = function(req, res, next) {
  QueryProductRecommendationService.createQueryProductRecommendation(req, res, next);
};
module.exports.retrieveQueryProductRecommendation = function(req, res, next) {
  QueryProductRecommendationService.retrieveQueryProductRecommendation(req, res, next);
};
