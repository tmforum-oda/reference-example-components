'use strict';
var ProcessFlow = require('../service/ProcessFlowService');

module.exports.createProcessFlow = function(req, res, next) {
  ProcessFlow.createProcessFlow(req, res, next);
};
module.exports.deleteProcessFlow = function(req, res, next) {
  ProcessFlow.deleteProcessFlow(req, res, next);
};
module.exports.listProcessFlow = function(req, res, next) {
  ProcessFlow.listProcessFlow(req, res, next);
};
module.exports.retrieveProcessFlow = function(req, res, next) {
  ProcessFlow.retrieveProcessFlow(req, res, next);
};
