'use strict';
const Controller = require('./Controller');
const service = require('../services/ResourceCatalogService');

const listResourceCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.listResourceCatalog);
};
const createResourceCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.createResourceCatalog);
};
const retrieveResourceCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveResourceCatalog);
};
const patchResourceCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchResourceCatalog);
};
const deleteResourceCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteResourceCatalog);
};

module.exports = { listResourceCatalog, createResourceCatalog, retrieveResourceCatalog, patchResourceCatalog, deleteResourceCatalog };
