'use strict';
const Controller = require('./Controller');
const service = require('../services/EventsSubscriptionService');

const createHub = async (request, response) => {
  await Controller.handleRequest(request, response, service.createHub);
};
const hubDelete = async (request, response) => {
  await Controller.handleRequest(request, response, service.hubDelete);
};

module.exports = { createHub, hubDelete };
