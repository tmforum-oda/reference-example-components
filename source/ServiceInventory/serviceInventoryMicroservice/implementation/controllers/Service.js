'use strict';

var url = require('url');

var Service = require('../service/ServiceService');

module.exports.createService = function createService (req, res, next) {
  Service.createService(req, res, next);
};

module.exports.deleteService = function deleteService (req, res, next) {
  Service.deleteService(req, res, next);
};

module.exports.listService = function listService (req, res, next) {
  Service.listService(req, res, next);
};

module.exports.patchService = function patchService (req, res, next) {
  Service.patchService(req, res, next);
};

module.exports.retrieveService = function retrieveService (req, res, next) {
  Service.retrieveService(req, res, next);
};

module.exports.registerListener = function registerListener (req, res, next) {
  Service.registerListener(req, res, next);
};

module.exports.unregisterListener = function unregisterListener (req, res, next) {
  Service.unregisterListener(req, res, next);
};

module.exports.listenToServiceCreateEvent = function listenToServiceCreateEvent (req, res, next) {
  Service.listenToServiceCreateEvent(req, res, next);
};

module.exports.listenToServiceAttributeValueChangeEvent = function listenToServiceAttributeValueChangeEvent (req, res, next) {
  Service.listenToServiceAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToServiceStateChangeEvent = function listenToServiceStateChangeEvent (req, res, next) {
  Service.listenToServiceStateChangeEvent(req, res, next);
};

module.exports.listenToServiceDeleteEvent = function listenToServiceDeleteEvent (req, res, next) {
  Service.listenToServiceDeleteEvent(req, res, next);
};
