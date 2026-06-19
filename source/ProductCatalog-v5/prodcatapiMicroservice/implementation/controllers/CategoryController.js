'use strict';
const Controller = require('./Controller');
const service = require('../services/CategoryService');

const listCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.listCategory);
};
const createCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.createCategory);
};
const retrieveCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveCategory);
};
const patchCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchCategory);
};
const deleteCategory = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteCategory);
};

module.exports = { listCategory, createCategory, retrieveCategory, patchCategory, deleteCategory };
