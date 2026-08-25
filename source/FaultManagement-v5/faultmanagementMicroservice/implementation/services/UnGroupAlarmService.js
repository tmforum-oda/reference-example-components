'use strict';
const Service = require('./Service');

const createUnGroupAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UnGroupAlarm';
  context.operationId = 'createUnGroupAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listUnGroupAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UnGroupAlarm';
  context.operationId = 'listUnGroupAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveUnGroupAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UnGroupAlarm';
  context.operationId = 'retrieveUnGroupAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createUnGroupAlarm, listUnGroupAlarm, retrieveUnGroupAlarm };
