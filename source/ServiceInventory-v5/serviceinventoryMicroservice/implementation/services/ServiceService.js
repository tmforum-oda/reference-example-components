'use strict';
const Service = require('./Service');
const { validateServiceSpecificationHref } = require('../utils/ruleUtils');

const createService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'createService';
  context.method      = 'post';
  try {
    if (args.body) await validateServiceSpecificationHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});

const listService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'listService';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'retrieveService';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'patchService';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'deleteService';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createService, listService, retrieveService, patchService, deleteService };
