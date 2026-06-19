'use strict';
var url = require('url');
var ServiceCategory = require('../service/ServiceCategoryService');
module.exports.listServiceCategory     = function(req,res,next){ ServiceCategory.listServiceCategory(req,res,next); };
module.exports.createServiceCategory   = function(req,res,next){ ServiceCategory.createServiceCategory(req,res,next); };
module.exports.retrieveServiceCategory = function(req,res,next){ ServiceCategory.retrieveServiceCategory(req,res,next); };
module.exports.patchServiceCategory    = function(req,res,next){ ServiceCategory.patchServiceCategory(req,res,next); };
module.exports.deleteServiceCategory   = function(req,res,next){ ServiceCategory.deleteServiceCategory(req,res,next); };
