'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductOfferingPriceService');

const listProductOfferingPrice = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProductOfferingPrice);
};
const createProductOfferingPrice = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProductOfferingPrice);
};
const retrieveProductOfferingPrice = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProductOfferingPrice);
};
const patchProductOfferingPrice = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProductOfferingPrice);
};
const deleteProductOfferingPrice = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteProductOfferingPrice);
};

module.exports = { listProductOfferingPrice, createProductOfferingPrice, retrieveProductOfferingPrice, patchProductOfferingPrice, deleteProductOfferingPrice };
