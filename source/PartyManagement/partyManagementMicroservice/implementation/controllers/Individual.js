'use strict';

var url = require('url');

var Individual = require('../service/IndividualService');

module.exports.listIndividual = function listIndividual (req, res, next) {
  Individual.listIndividual(req, res, next);
};

module.exports.createIndividual = function createIndividual (req, res, next) {
  Individual.createIndividual(req, res, next);
};

module.exports.retrieveIndividual = function retrieveIndividual (req, res, next) {
  Individual.retrieveIndividual(req, res, next);
};

module.exports.patchIndividual = function patchIndividual (req, res, next) {
  Individual.patchIndividual(req, res, next);
};

module.exports.deleteIndividual = function deleteIndividual (req, res, next) {
  Individual.deleteIndividual(req, res, next);
};
