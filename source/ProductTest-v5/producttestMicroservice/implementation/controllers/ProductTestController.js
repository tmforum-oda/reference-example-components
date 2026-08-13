'use strict';
const Controller = require('./Controller');
const service = require('../services/ProductTestService');

const listProductTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProductTest);
};
const createProductTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProductTest);
};
const retrieveProductTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveProductTest);
};
const patchProductTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProductTest);
};

module.exports = { listProductTest, createProductTest, retrieveProductTest, patchProductTest };
