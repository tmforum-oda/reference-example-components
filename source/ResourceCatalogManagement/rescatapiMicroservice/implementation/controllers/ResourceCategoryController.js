'use strict';
const Controller = require('./Controller');
const service = require('../services/ResourceCategoryService');

const listResourceCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.listResourceCategory);
};
const createResourceCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.createResourceCategory);
};
const retrieveResourceCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveResourceCategory);
};
const patchResourceCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchResourceCategory);
};
const deleteResourceCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteResourceCategory);
};

module.exports = { listResourceCategory, createResourceCategory, retrieveResourceCategory, patchResourceCategory, deleteResourceCategory };
