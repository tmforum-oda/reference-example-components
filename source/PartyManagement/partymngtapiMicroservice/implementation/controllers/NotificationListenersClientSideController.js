'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenersClientSideService');

const individualAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.individualAttributeValueChangeEvent);
};
const individualCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.individualCreateEvent);
};
const individualDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.individualDeleteEvent);
};
const individualStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.individualStateChangeEvent);
};
const organizationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.organizationAttributeValueChangeEvent);
};
const organizationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.organizationCreateEvent);
};
const organizationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.organizationDeleteEvent);
};
const organizationStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.organizationStateChangeEvent);
};

module.exports = {
  individualAttributeValueChangeEvent, individualCreateEvent, individualDeleteEvent, individualStateChangeEvent,
  organizationAttributeValueChangeEvent, organizationCreateEvent, organizationDeleteEvent, organizationStateChangeEvent,
};
