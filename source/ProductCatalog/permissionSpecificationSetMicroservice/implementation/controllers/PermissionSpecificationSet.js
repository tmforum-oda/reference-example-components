'use strict';

var utils = require('../utils/writer.js');
var PermissionSpecificationSet = require('../service/PermissionSpecificationSetService');

module.exports.createPermissionSpecificationSet = function createPermissionSpecificationSet (req, res, next, body, fields) {
  PermissionSpecificationSet.createPermissionSpecificationSet(body, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deletePermissionSpecificationSet = function deletePermissionSpecificationSet (req, res, next, id) {
  PermissionSpecificationSet.deletePermissionSpecificationSet(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listPermissionSpecificationSet = function listPermissionSpecificationSet (req, res, next, fields, offset, limit, before, after, sort, filter) {
  PermissionSpecificationSet.listPermissionSpecificationSet(fields, offset, limit, before, after, sort, filter)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.patchPermissionSpecificationSet = function patchPermissionSpecificationSet (req, res, next, body, fields, id) {
  PermissionSpecificationSet.patchPermissionSpecificationSet(body, fields, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.patchPermissionSpecificationSet = function patchPermissionSpecificationSet (req, res, next, body, fields, id) {
  PermissionSpecificationSet.patchPermissionSpecificationSet(body, fields, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.retrievePermissionSpecificationSet = function retrievePermissionSpecificationSet (req, res, next, id, fields) {
  PermissionSpecificationSet.retrievePermissionSpecificationSet(id, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
