'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductService');

const createProduct = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProduct);
};
const listProduct = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProduct);
};
const retrieveProduct = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProduct);
};
const patchProduct = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProduct);
};
const deleteProduct = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteProduct);
};

module.exports = { createProduct, listProduct, retrieveProduct, patchProduct, deleteProduct };
