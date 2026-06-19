'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenersClientSideService');

const partyRoleAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleAttributeValueChangeEvent);
};
const partyRoleCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleCreateEvent);
};
const partyRoleDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleDeleteEvent);
};
const partyRoleSpecificationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleSpecificationAttributeValueChangeEvent);
};
const partyRoleSpecificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleSpecificationCreateEvent);
};
const partyRoleSpecificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleSpecificationDeleteEvent);
};
const partyRoleSpecificationStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleSpecificationStateChangeEvent);
};
const partyRoleStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyRoleStateChangeEvent);
};

module.exports = {
  partyRoleAttributeValueChangeEvent, partyRoleCreateEvent, partyRoleDeleteEvent,
  partyRoleSpecificationAttributeValueChangeEvent, partyRoleSpecificationCreateEvent,
  partyRoleSpecificationDeleteEvent, partyRoleSpecificationStateChangeEvent,
  partyRoleStateChangeEvent
};
