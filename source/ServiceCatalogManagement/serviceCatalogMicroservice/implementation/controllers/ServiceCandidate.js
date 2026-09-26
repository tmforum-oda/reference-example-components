'use strict';
var url = require('url');
var ServiceCandidate = require('../service/ServiceCandidateService');

module.exports.createServiceCandidate = function(req, res, next) {
  ServiceCandidate.createServiceCandidate(req, res, next);
};
module.exports.deleteServiceCandidate = function(req, res, next) {
  ServiceCandidate.deleteServiceCandidate(req, res, next);
};
module.exports.listServiceCandidate = function(req, res, next) {
  ServiceCandidate.listServiceCandidate(req, res, next);
};
module.exports.patchServiceCandidate = function(req, res, next) {
  ServiceCandidate.patchServiceCandidate(req, res, next);
};
module.exports.retrieveServiceCandidate = function(req, res, next) {
  ServiceCandidate.retrieveServiceCandidate(req, res, next);
};
