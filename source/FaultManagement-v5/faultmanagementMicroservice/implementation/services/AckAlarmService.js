'use strict';
const Service = require('./Service');

const createAckAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'AckAlarm';
  context.operationId = 'createAckAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listAckAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'AckAlarm';
  context.operationId = 'listAckAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveAckAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'AckAlarm';
  context.operationId = 'retrieveAckAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createAckAlarm, listAckAlarm, retrieveAckAlarm };
