'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductSpecificationService');

const listProductSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProductSpecification);
};
const createProductSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProductSpecification);
};
const retrieveProductSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProductSpecification);
};
const patchProductSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProductSpecification);
};
const deleteProductSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteProductSpecification);
};

module.exports = { listProductSpecification, createProductSpecification, retrieveProductSpecification, patchProductSpecification, deleteProductSpecification };
