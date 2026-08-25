'use strict';
const Controller = require('./Controller');
const service = require('../services/AckAlarmService');

const createAckAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createAckAlarm);
};
const listAckAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listAckAlarm);
};
const retrieveAckAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveAckAlarm);
};

module.exports = { createAckAlarm, listAckAlarm, retrieveAckAlarm };
