'use strict';
var url = require('url');
var ServiceCatalog = require('../service/ServiceCatalogService');

module.exports.createServiceCatalog = function(req, res, next) {
  ServiceCatalog.createServiceCatalog(req, res, next);
};
module.exports.deleteServiceCatalog = function(req, res, next) {
  ServiceCatalog.deleteServiceCatalog(req, res, next);
};
module.exports.listServiceCatalog = function(req, res, next) {
  ServiceCatalog.listServiceCatalog(req, res, next);
};
module.exports.patchServiceCatalog = function(req, res, next) {
  ServiceCatalog.patchServiceCatalog(req, res, next);
};
module.exports.retrieveServiceCatalog = function(req, res, next) {
  ServiceCatalog.retrieveServiceCatalog(req, res, next);
};
