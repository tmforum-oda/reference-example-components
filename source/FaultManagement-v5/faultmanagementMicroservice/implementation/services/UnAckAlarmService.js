'use strict';
const Service = require('./Service');

const createUnAckAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UnAckAlarm';
  context.operationId = 'createUnAckAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listUnAckAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UnAckAlarm';
  context.operationId = 'listUnAckAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveUnAckAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UnAckAlarm';
  context.operationId = 'retrieveUnAckAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createUnAckAlarm, listUnAckAlarm, retrieveUnAckAlarm };
