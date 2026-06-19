'use strict';
var url = require('url');
var UserRole = require('../service/UserRoleService');

module.exports.listUserRole = function(req, res, next) {
  UserRole.listUserRole(req, res, next);
};
module.exports.createUserRole = function(req, res, next) {
  UserRole.createUserRole(req, res, next);
};
module.exports.retrieveUserRole = function(req, res, next) {
  UserRole.retrieveUserRole(req, res, next);
};
module.exports.patchUserRole = function(req, res, next) {
  UserRole.patchUserRole(req, res, next);
};
