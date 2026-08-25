'use strict';
const Service = require('./Service');

const createGroupAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'GroupAlarm';
  context.operationId = 'createGroupAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listGroupAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'GroupAlarm';
  context.operationId = 'listGroupAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveGroupAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'GroupAlarm';
  context.operationId = 'retrieveGroupAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createGroupAlarm, listGroupAlarm, retrieveGroupAlarm };
