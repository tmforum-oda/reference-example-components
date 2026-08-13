'use strict';
var MonitorService = require('../service/MonitorService');

module.exports.listMonitor = function(req, res, next) {
  MonitorService.listMonitor(req, res, next);
};
module.exports.retrieveMonitor = function(req, res, next) {
  MonitorService.retrieveMonitor(req, res, next);
};
