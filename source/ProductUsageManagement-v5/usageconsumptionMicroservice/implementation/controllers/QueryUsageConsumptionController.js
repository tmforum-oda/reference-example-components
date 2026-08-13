'use strict';
const Controller = require('./Controller');
const service = require('../services/QueryUsageConsumptionService');

const listQueryUsageConsumption = async (request, response) => {
  await Controller.handleRequest(request, response, service.listQueryUsageConsumption);
};
const createQueryUsageConsumption = async (request, response) => {
  await Controller.handleRequest(request, response, service.createQueryUsageConsumption);
};
const retrieveQueryUsageConsumption = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveQueryUsageConsumption);
};
const deleteQueryUsageConsumption = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteQueryUsageConsumption);
};

module.exports = {
  listQueryUsageConsumption,
  createQueryUsageConsumption,
  retrieveQueryUsageConsumption,
  deleteQueryUsageConsumption,
};
