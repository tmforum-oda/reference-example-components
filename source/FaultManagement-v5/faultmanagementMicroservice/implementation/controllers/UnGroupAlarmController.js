'use strict';
const Controller = require('./Controller');
const service = require('../services/UnGroupAlarmService');

const createUnGroupAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createUnGroupAlarm);
};
const listUnGroupAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listUnGroupAlarm);
};
const retrieveUnGroupAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveUnGroupAlarm);
};

module.exports = { createUnGroupAlarm, listUnGroupAlarm, retrieveUnGroupAlarm };
