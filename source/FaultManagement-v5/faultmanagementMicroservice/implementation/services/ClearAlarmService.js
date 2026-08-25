'use strict';
const Service = require('./Service');

const createClearAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ClearAlarm';
  context.operationId = 'createClearAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listClearAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ClearAlarm';
  context.operationId = 'listClearAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveClearAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ClearAlarm';
  context.operationId = 'retrieveClearAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createClearAlarm, listClearAlarm, retrieveClearAlarm };
