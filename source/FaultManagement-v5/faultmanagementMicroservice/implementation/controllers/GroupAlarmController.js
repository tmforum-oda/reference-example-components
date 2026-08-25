'use strict';
const Controller = require('./Controller');
const service = require('../services/GroupAlarmService');

const createGroupAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createGroupAlarm);
};
const listGroupAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listGroupAlarm);
};
const retrieveGroupAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveGroupAlarm);
};

module.exports = { createGroupAlarm, listGroupAlarm, retrieveGroupAlarm };
