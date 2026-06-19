'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductOfferingService');

const listProductOffering = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProductOffering);
};
const createProductOffering = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProductOffering);
};
const retrieveProductOffering = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProductOffering);
};
const patchProductOffering = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProductOffering);
};
const deleteProductOffering = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteProductOffering);
};

module.exports = { listProductOffering, createProductOffering, retrieveProductOffering, patchProductOffering, deleteProductOffering };
