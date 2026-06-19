'use strict';
var url = require('url');
var ExportJob = require('../service/ExportJobService');
module.exports.listExportJob     = function(req,res,next){ ExportJob.listExportJob(req,res,next); };
module.exports.createExportJob   = function(req,res,next){ ExportJob.createExportJob(req,res,next); };
module.exports.retrieveExportJob = function(req,res,next){ ExportJob.retrieveExportJob(req,res,next); };
module.exports.deleteExportJob   = function(req,res,next){ ExportJob.deleteExportJob(req,res,next); };
