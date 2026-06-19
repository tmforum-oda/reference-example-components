'use strict';
var url = require('url');
var Permission = require('../service/PermissionService');

module.exports.listPermission = function(req, res, next) {
  Permission.listPermission(req, res, next);
};
module.exports.createPermission = function(req, res, next) {
  Permission.createPermission(req, res, next);
};
module.exports.retrievePermission = function(req, res, next) {
  Permission.retrievePermission(req, res, next);
};
module.exports.patchPermission = function(req, res, next) {
  Permission.patchPermission(req, res, next);
};
