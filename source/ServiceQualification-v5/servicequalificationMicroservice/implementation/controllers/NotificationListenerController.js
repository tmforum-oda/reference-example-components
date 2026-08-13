'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenerService');

const checkServiceQualificationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.checkServiceQualificationAttributeValueChangeEvent);
};
const checkServiceQualificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.checkServiceQualificationCreateEvent);
};
const checkServiceQualificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.checkServiceQualificationDeleteEvent);
};
const checkServiceQualificationInformationRequiredEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.checkServiceQualificationInformationRequiredEvent);
};
const checkServiceQualificationStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.checkServiceQualificationStateChangeEvent);
};
const queryServiceQualificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.queryServiceQualificationCreateEvent);
};
const queryServiceQualificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.queryServiceQualificationDeleteEvent);
};
const queryServiceQualificationStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.queryServiceQualificationStateChangeEvent);
};

module.exports = {
  checkServiceQualificationAttributeValueChangeEvent,
  checkServiceQualificationCreateEvent,
  checkServiceQualificationDeleteEvent,
  checkServiceQualificationInformationRequiredEvent,
  checkServiceQualificationStateChangeEvent,
  queryServiceQualificationCreateEvent,
  queryServiceQualificationDeleteEvent,
  queryServiceQualificationStateChangeEvent
};
