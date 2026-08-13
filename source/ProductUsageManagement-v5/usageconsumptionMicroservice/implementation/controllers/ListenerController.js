'use strict';
const Controller = require('./Controller');
const service = require('../services/ListenerService');

const queryUsageConsumptionCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.queryUsageConsumptionCreateEvent);
};
const queryUsageConsumptionDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.queryUsageConsumptionDeleteEvent);
};
const queryUsageConsumptionStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.queryUsageConsumptionStateChangeEvent);
};
const usageConsumptionReportCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.usageConsumptionReportCreateEvent);
};
const usageConsumptionReportDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.usageConsumptionReportDeleteEvent);
};

module.exports = {
  queryUsageConsumptionCreateEvent,
  queryUsageConsumptionDeleteEvent,
  queryUsageConsumptionStateChangeEvent,
  usageConsumptionReportCreateEvent,
  usageConsumptionReportDeleteEvent,
};
