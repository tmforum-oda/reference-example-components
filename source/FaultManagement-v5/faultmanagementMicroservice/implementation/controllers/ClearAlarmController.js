'use strict';
const Controller = require('./Controller');
const service = require('../services/ClearAlarmService');

const createClearAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createClearAlarm);
};
const listClearAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listClearAlarm);
};
const retrieveClearAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveClearAlarm);
};

module.exports = { createClearAlarm, listClearAlarm, retrieveClearAlarm };
