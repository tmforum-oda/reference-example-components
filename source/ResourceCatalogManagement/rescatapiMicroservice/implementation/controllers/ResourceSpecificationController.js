'use strict';
const Controller = require('./Controller');
const service = require('../services/ResourceSpecificationService');

const listResourceSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listResourceSpecification);
};
const createResourceSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createResourceSpecification);
};
const retrieveResourceSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveResourceSpecification);
};
const patchResourceSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchResourceSpecification);
};
const deleteResourceSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteResourceSpecification);
};

module.exports = { listResourceSpecification, createResourceSpecification, retrieveResourceSpecification, patchResourceSpecification, deleteResourceSpecification };
