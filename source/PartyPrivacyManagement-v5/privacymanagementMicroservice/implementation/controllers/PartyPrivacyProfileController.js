'use strict';
const Controller = require('./Controller');
const service = require('../services/PartyPrivacyProfileService');

const listPartyPrivacyProfile = async (request, response) => {
  await Controller.handleRequest(request, response, service.listPartyPrivacyProfile);
};
const createPartyPrivacyProfile = async (request, response) => {
  await Controller.handleRequest(request, response, service.createPartyPrivacyProfile);
};
const retrievePartyPrivacyProfile = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrievePartyPrivacyProfile);
};
const patchPartyPrivacyProfile = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchPartyPrivacyProfile);
};
const deletePartyPrivacyProfile = async (request, response) => {
  await Controller.handleRequest(request, response, service.deletePartyPrivacyProfile);
};

module.exports = {
  listPartyPrivacyProfile,
  createPartyPrivacyProfile,
  retrievePartyPrivacyProfile,
  patchPartyPrivacyProfile,
  deletePartyPrivacyProfile,
};
