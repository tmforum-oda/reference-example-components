'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenersClientSideService');

const serviceAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.serviceAttributeValueChangeEvent);
};
const serviceCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.serviceCreateEvent);
};
const serviceDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.serviceDeleteEvent);
};
const serviceOperatingStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.serviceOperatingStatusChangeEvent);
};
const serviceStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.serviceStateChangeEvent);
};

module.exports = {
  serviceAttributeValueChangeEvent,
  serviceCreateEvent,
  serviceDeleteEvent,
  serviceOperatingStatusChangeEvent,
  serviceStateChangeEvent,
};
