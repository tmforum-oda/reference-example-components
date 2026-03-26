'use strict';

const {sendDoc} = require('../utils/mongoUtils');
const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

function listenToEvent(req, res, next) {
  sendDoc(res, 204, {});
}

exports.listenToServiceCatalogCreateEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCatalogChangeEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCatalogDeleteEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCatalogBatchEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCategoryCreateEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCategoryChangeEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCategoryDeleteEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCandidateCreateEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCandidateChangeEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceCandidateDeleteEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceSpecificationCreateEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceSpecificationChangeEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceSpecificationDeleteEvent = function(req, res, next) { listenToEvent(req, res, next); };
