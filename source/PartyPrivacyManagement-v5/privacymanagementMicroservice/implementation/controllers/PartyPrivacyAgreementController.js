'use strict';
const Controller = require('./Controller');
const service = require('../services/PartyPrivacyAgreementService');

const listPartyPrivacyAgreement = async (request, response) => {
  await Controller.handleRequest(request, response, service.listPartyPrivacyAgreement);
};
const createPartyPrivacyAgreement = async (request, response) => {
  await Controller.handleRequest(request, response, service.createPartyPrivacyAgreement);
};
const retrievePartyPrivacyAgreement = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrievePartyPrivacyAgreement);
};
const patchPartyPrivacyAgreement = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchPartyPrivacyAgreement);
};
const deletePartyPrivacyAgreement = async (request, response) => {
  await Controller.handleRequest(request, response, service.deletePartyPrivacyAgreement);
};

module.exports = {
  listPartyPrivacyAgreement,
  createPartyPrivacyAgreement,
  retrievePartyPrivacyAgreement,
  patchPartyPrivacyAgreement,
  deletePartyPrivacyAgreement,
};
