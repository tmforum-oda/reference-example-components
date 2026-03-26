'use strict';
var url = require('url');
var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToServiceCatalogCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCatalogCreateEvent(req, res, next);
};
module.exports.listenToServiceCatalogChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCatalogChangeEvent(req, res, next);
};
module.exports.listenToServiceCatalogDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCatalogDeleteEvent(req, res, next);
};
module.exports.listenToServiceCatalogBatchEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCatalogBatchEvent(req, res, next);
};
module.exports.listenToServiceCategoryCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCategoryCreateEvent(req, res, next);
};
module.exports.listenToServiceCategoryChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCategoryChangeEvent(req, res, next);
};
module.exports.listenToServiceCategoryDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCategoryDeleteEvent(req, res, next);
};
module.exports.listenToServiceCandidateCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCandidateCreateEvent(req, res, next);
};
module.exports.listenToServiceCandidateChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCandidateChangeEvent(req, res, next);
};
module.exports.listenToServiceCandidateDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceCandidateDeleteEvent(req, res, next);
};
module.exports.listenToServiceSpecificationCreateEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceSpecificationCreateEvent(req, res, next);
};
module.exports.listenToServiceSpecificationChangeEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceSpecificationChangeEvent(req, res, next);
};
module.exports.listenToServiceSpecificationDeleteEvent = function(req, res, next) {
  NotificationListenersClientSide.listenToServiceSpecificationDeleteEvent(req, res, next);
};
