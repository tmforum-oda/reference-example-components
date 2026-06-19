'use strict';
const Controller = require('./Controller');
const service = require('../services/PartyRoleSpecificationService');

const listPartyRoleSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listPartyRoleSpecification);
};
const createPartyRoleSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createPartyRoleSpecification);
};
const retrievePartyRoleSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrievePartyRoleSpecification);
};
const patchPartyRoleSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchPartyRoleSpecification);
};
const deletePartyRoleSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deletePartyRoleSpecification);
};

module.exports = {
  listPartyRoleSpecification, createPartyRoleSpecification,
  retrievePartyRoleSpecification, patchPartyRoleSpecification, deletePartyRoleSpecification
};
