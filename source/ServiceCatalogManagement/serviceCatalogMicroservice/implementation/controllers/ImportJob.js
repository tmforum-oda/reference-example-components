'use strict';
var url = require('url');
var ImportJob = require('../service/ImportJobService');

module.exports.createImportJob = function(req, res, next) {
  ImportJob.createImportJob(req, res, next);
};
module.exports.deleteImportJob = function(req, res, next) {
  ImportJob.deleteImportJob(req, res, next);
};
module.exports.listImportJob = function(req, res, next) {
  ImportJob.listImportJob(req, res, next);
};
module.exports.retrieveImportJob = function(req, res, next) {
  ImportJob.retrieveImportJob(req, res, next);
};
