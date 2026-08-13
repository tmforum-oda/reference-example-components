'use strict';
const Controller = require('./Controller');
const service = require('../services/UsageConsumptionReportService');

const listUsageConsumptionReport = async (request, response) => {
  await Controller.handleRequest(request, response, service.listUsageConsumptionReport);
};
const createUsageConsumptionReport = async (request, response) => {
  await Controller.handleRequest(request, response, service.createUsageConsumptionReport);
};
const retrieveUsageConsumptionReport = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveUsageConsumptionReport);
};
const deleteUsageConsumptionReport = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteUsageConsumptionReport);
};

module.exports = {
  listUsageConsumptionReport,
  createUsageConsumptionReport,
  retrieveUsageConsumptionReport,
  deleteUsageConsumptionReport,
};
