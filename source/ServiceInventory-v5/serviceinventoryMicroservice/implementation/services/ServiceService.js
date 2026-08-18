'use strict';
const Service = require('./Service');
const { validateServiceSpecificationHref } = require('../utils/ruleUtils');

// Service.serve may reject with an already-normalized { error, code } response.
// Preserve it so a database not-found remains HTTP 404 instead of being replaced
// by the historical generic HTTP 405 fallback.
const normalizeOperationError = (error) => {
  if (error?.code !== undefined && error?.error !== undefined) return error;
  return Service.rejectResponse(error);
};

const createService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'createService';
  context.method      = 'post';
  try {
    if (args.body) await validateServiceSpecificationHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const listService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'listService';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const retrieveService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'retrieveService';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const patchService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'patchService';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const deleteService = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Service';
  context.operationId = 'deleteService';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

module.exports = { createService, listService, retrieveService, patchService, deleteService };
