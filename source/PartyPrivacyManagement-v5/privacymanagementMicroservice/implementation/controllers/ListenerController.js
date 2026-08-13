'use strict';
const Controller = require('./Controller');
const service = require('../services/ListenerService');

const partyPrivacyAgreementAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyAgreementAttributeValueChangeEvent);
};
const partyPrivacyAgreementCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyAgreementCreateEvent);
};
const partyPrivacyAgreementDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyAgreementDeleteEvent);
};
const partyPrivacyAgreementStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyAgreementStatusChangeEvent);
};
const partyPrivacyProfileAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileAttributeValueChangeEvent);
};
const partyPrivacyProfileCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileCreateEvent);
};
const partyPrivacyProfileDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileDeleteEvent);
};
const partyPrivacyProfileSpecificationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileSpecificationAttributeValueChangeEvent);
};
const partyPrivacyProfileSpecificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileSpecificationCreateEvent);
};
const partyPrivacyProfileSpecificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileSpecificationDeleteEvent);
};
const partyPrivacyProfileSpecificationStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileSpecificationStatusChangeEvent);
};
const partyPrivacyProfileStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.partyPrivacyProfileStatusChangeEvent);
};

module.exports = {
  partyPrivacyAgreementAttributeValueChangeEvent,
  partyPrivacyAgreementCreateEvent,
  partyPrivacyAgreementDeleteEvent,
  partyPrivacyAgreementStatusChangeEvent,
  partyPrivacyProfileAttributeValueChangeEvent,
  partyPrivacyProfileCreateEvent,
  partyPrivacyProfileDeleteEvent,
  partyPrivacyProfileSpecificationAttributeValueChangeEvent,
  partyPrivacyProfileSpecificationCreateEvent,
  partyPrivacyProfileSpecificationDeleteEvent,
  partyPrivacyProfileSpecificationStatusChangeEvent,
  partyPrivacyProfileStatusChangeEvent,
};
