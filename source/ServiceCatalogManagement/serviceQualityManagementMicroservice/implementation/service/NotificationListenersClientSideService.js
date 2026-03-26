'use strict';

const {sendDoc} = require('../utils/mongoUtils');

function listenToEvent(req, res, next) {
  sendDoc(res, 204, {});
}

exports.listenToServiceLevelObjectiveCreateEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceLevelObjectiveAttributeValueChangeEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceLevelObjectiveDeleteEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceLevelSpecificationCreateEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceLevelSpecificationAttributeValueChangeEvent = function(req, res, next) { listenToEvent(req, res, next); };
exports.listenToServiceLevelSpecificationDeleteEvent = function(req, res, next) { listenToEvent(req, res, next); };
