'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductCatalogService');

const listProductCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProductCatalog);
};
const createProductCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProductCatalog);
};
const retrieveProductCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProductCatalog);
};
const patchProductCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProductCatalog);
};
const deleteProductCatalog = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteProductCatalog);
};

module.exports = { listProductCatalog, createProductCatalog, retrieveProductCatalog, patchProductCatalog, deleteProductCatalog };
