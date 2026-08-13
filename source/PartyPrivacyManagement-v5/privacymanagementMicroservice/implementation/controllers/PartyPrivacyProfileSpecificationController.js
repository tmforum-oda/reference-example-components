'use strict';
const Controller = require('./Controller');
const service = require('../services/PartyPrivacyProfileSpecificationService');

const listPartyPrivacyProfileSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listPartyPrivacyProfileSpecification);
};
const createPartyPrivacyProfileSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createPartyPrivacyProfileSpecification);
};
const retrievePartyPrivacyProfileSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrievePartyPrivacyProfileSpecification);
};
const patchPartyPrivacyProfileSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchPartyPrivacyProfileSpecification);
};
const deletePartyPrivacyProfileSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deletePartyPrivacyProfileSpecification);
};

module.exports = {
  listPartyPrivacyProfileSpecification,
  createPartyPrivacyProfileSpecification,
  retrievePartyPrivacyProfileSpecification,
  patchPartyPrivacyProfileSpecification,
  deletePartyPrivacyProfileSpecification,
};
