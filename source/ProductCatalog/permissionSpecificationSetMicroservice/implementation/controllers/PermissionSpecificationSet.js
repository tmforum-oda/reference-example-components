'use strict';

var utils = require('../utils/writer.js');
var PermissionSpecificationSet = require('../service/PermissionSpecificationSetService');

module.exports.createPermissionSpecificationSet = function createPermissionSpecificationSet (req, res, next, body, fields) {
  PermissionSpecificationSet.createPermissionSpecificationSet(req, res, next, body, fields)
};

module.exports.deletePermissionSpecificationSet = function deletePermissionSpecificationSet (req, res, next, id) {
  PermissionSpecificationSet.deletePermissionSpecificationSet(req, res, next, id)
};

module.exports.listPermissionSpecificationSet = function listPermissionSpecificationSet (req, res, next, fields, offset, limit, before, after, name, description, involvementRole, sort, filter) {
  PermissionSpecificationSet.listPermissionSpecificationSet(req, res, next, fields, offset, limit, before, after, name, description, involvementRole, sort, filter)
};

module.exports.patchPermissionSpecificationSet = function patchPermissionSpecificationSet (req, res, next, body, fields, id) {
  PermissionSpecificationSet.patchPermissionSpecificationSet (req, res, next, body, fields, id)
};

module.exports.retrievePermissionSpecificationSet = function retrievePermissionSpecificationSet (req, res, next, fields, id) {
  PermissionSpecificationSet.retrievePermissionSpecificationSet (req, res, next, fields, id)
};
