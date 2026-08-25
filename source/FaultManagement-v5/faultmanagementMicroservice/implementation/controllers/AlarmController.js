'use strict';
const Controller = require('./Controller');
const service = require('../services/AlarmService');

const createAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createAlarm);
};
const listAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listAlarm);
};
const retrieveAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveAlarm);
};
const patchAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchAlarm);
};
const deleteAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteAlarm);
};

module.exports = { createAlarm, listAlarm, retrieveAlarm, patchAlarm, deleteAlarm };
