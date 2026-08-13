'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductTestSpecificationService');

const listProductTestSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProductTestSpecification);
};
const createProductTestSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProductTestSpecification);
};
const retrieveProductTestSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProductTestSpecification);
};
const patchProductTestSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProductTestSpecification);
};
const deleteProductTestSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteProductTestSpecification);
};

module.exports = {
  listProductTestSpecification,
  createProductTestSpecification,
  retrieveProductTestSpecification,
  patchProductTestSpecification,
  deleteProductTestSpecification,
};
