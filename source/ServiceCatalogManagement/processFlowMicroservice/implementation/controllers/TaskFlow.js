'use strict';
var TaskFlow = require('../service/TaskFlowService');

module.exports.listTaskFlow = function(req, res, next) {
  TaskFlow.listTaskFlow(req, res, next);
};
module.exports.patchTaskFlow = function(req, res, next) {
  TaskFlow.patchTaskFlow(req, res, next);
};
module.exports.retrieveTaskFlow = function(req, res, next) {
  TaskFlow.retrieveTaskFlow(req, res, next);
};
