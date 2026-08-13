'use strict';
const Service = require('./Service');

const createHub = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Hub';
  context.operationId = 'createHub';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});
const hubGet = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Hub';
  context.operationId = 'hubGet';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});
const hubDelete = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Hub';
  context.operationId = 'hubDelete';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createHub, hubGet, hubDelete };
