'use strict';

var url = require('url');

var Organization = require('../service/OrganizationService');

module.exports.listOrganization = function listOrganization (req, res, next) {
  Organization.listOrganization(req, res, next);
};

module.exports.createOrganization = function createOrganization (req, res, next) {
  Organization.createOrganization(req, res, next);
};

module.exports.retrieveOrganization = function retrieveOrganization (req, res, next) {
  Organization.retrieveOrganization(req, res, next);
};

module.exports.patchOrganization = function patchOrganization (req, res, next) {
  Organization.patchOrganization(req, res, next);
};

module.exports.deleteOrganization = function deleteOrganization (req, res, next) {
  Organization.deleteOrganization(req, res, next);
};
