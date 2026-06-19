'use strict';
const Controller = require('./Controller');
const service = require('../services/OrganizationService');

const listOrganization = async (request, response) => {
  await Controller.handleRequest(request, response, service.listOrganization);
};
const createOrganization = async (request, response) => {
  await Controller.handleRequest(request, response, service.createOrganization);
};
const retrieveOrganization = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveOrganization);
};
const patchOrganization = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchOrganization);
};
const deleteOrganization = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteOrganization);
};

module.exports = { listOrganization, createOrganization, retrieveOrganization, patchOrganization, deleteOrganization };
