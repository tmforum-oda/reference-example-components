'use strict';

var ResourceService = require('../service/ResourceService');

module.exports.listenToResourceCreateEvent = function listenToResourceCreateEvent(req, res, next) {
  ResourceService.listenToResourceCreateEvent(req, res, next);
};

module.exports.listenToResourceAttributeValueChangeEvent = function listenToResourceAttributeValueChangeEvent(req, res, next) {
  ResourceService.listenToResourceAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToResourceStateChangeEvent = function listenToResourceStateChangeEvent(req, res, next) {
  ResourceService.listenToResourceStateChangeEvent(req, res, next);
};

module.exports.listenToResourceDeleteEvent = function listenToResourceDeleteEvent(req, res, next) {
  ResourceService.listenToResourceDeleteEvent(req, res, next);
};
