'use strict';
const Controller = require('./Controller');
const service = require('../services/UnAckAlarmService');

const createUnAckAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createUnAckAlarm);
};
const listUnAckAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listUnAckAlarm);
};
const retrieveUnAckAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveUnAckAlarm);
};

module.exports = { createUnAckAlarm, listUnAckAlarm, retrieveUnAckAlarm };
