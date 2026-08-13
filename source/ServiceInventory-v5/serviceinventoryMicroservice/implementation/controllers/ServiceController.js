'use strict';
const Controller = require('./Controller');
const service = require('../services/ServiceService');

const createService = async (request, response) => {
  await Controller.handleRequest(request, response, service.createService);
};
const listService = async (request, response) => {
  await Controller.handleRequest(request, response, service.listService);
};
const retrieveService = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveService);
};
const patchService = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchService);
};
const deleteService = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteService);
};

module.exports = { createService, listService, retrieveService, patchService, deleteService };
