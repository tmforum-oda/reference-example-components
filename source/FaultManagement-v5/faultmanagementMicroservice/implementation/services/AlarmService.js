'use strict';
const Service = require('./Service');

const createAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Alarm';
  context.operationId = 'createAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Alarm';
  context.operationId = 'listAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Alarm';
  context.operationId = 'retrieveAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Alarm';
  context.operationId = 'patchAlarm';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Alarm';
  context.operationId = 'deleteAlarm';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createAlarm, listAlarm, retrieveAlarm, patchAlarm, deleteAlarm };
