'use strict';
var url = require('url');
var S = require('../service/NotificationListenersClientSideService');
module.exports.listenToServiceLevelObjectiveCreateEvent = function(req,res,next){ S.listenToServiceLevelObjectiveCreateEvent(req,res,next); };
module.exports.listenToServiceLevelObjectiveAttributeValueChangeEvent = function(req,res,next){ S.listenToServiceLevelObjectiveAttributeValueChangeEvent(req,res,next); };
module.exports.listenToServiceLevelObjectiveDeleteEvent = function(req,res,next){ S.listenToServiceLevelObjectiveDeleteEvent(req,res,next); };
module.exports.listenToServiceLevelSpecificationCreateEvent = function(req,res,next){ S.listenToServiceLevelSpecificationCreateEvent(req,res,next); };
module.exports.listenToServiceLevelSpecificationAttributeValueChangeEvent = function(req,res,next){ S.listenToServiceLevelSpecificationAttributeValueChangeEvent(req,res,next); };
module.exports.listenToServiceLevelSpecificationDeleteEvent = function(req,res,next){ S.listenToServiceLevelSpecificationDeleteEvent(req,res,next); };
