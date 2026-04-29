'use strict';

const {sendError, TError, TErrorEnum} = require('../utils/errorUtils');

function listenTo(req, res) {
  res.statusCode = 204;
  res.end();
}

module.exports.listenToProcessFlowCreateEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToProcessFlowStateChangeEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToProcessFlowDeleteEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToProcessFlowAttributeValueChangeEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToTaskFlowCreateEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToTaskFlowStateChangeEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToTaskFlowDeleteEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToTaskFlowAttributeValueChangeEvent = function(req, res, next) { listenTo(req, res); };
module.exports.listenToTaskFlowInformationRequiredEvent = function(req, res, next) { listenTo(req, res); };
