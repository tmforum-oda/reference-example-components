'use strict';
const Controller = require('./Controller');
const service = require('../services/PartyRoleService');

const listPartyRole = async (request, response) => {
  await Controller.handleRequest(request, response, service.listPartyRole);
};
const createPartyRole = async (request, response) => {
  await Controller.handleRequest(request, response, service.createPartyRole);
};
const retrievePartyRole = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrievePartyRole);
};
const patchPartyRole = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchPartyRole);
};
const deletePartyRole = async (request, response) => {
  await Controller.handleRequest(request, response, service.deletePartyRole);
};

module.exports = { listPartyRole, createPartyRole, retrievePartyRole, patchPartyRole, deletePartyRole };
