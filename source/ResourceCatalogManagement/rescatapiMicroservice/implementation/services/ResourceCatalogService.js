'use strict';
const Service = require('./Service');

const listResourceCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCatalog';
  context.operationId = 'listResourceCatalog';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const createResourceCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCatalog';
  context.operationId = 'createResourceCatalog';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveResourceCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCatalog';
  context.operationId = 'retrieveResourceCatalog';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchResourceCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCatalog';
  context.operationId = 'patchResourceCatalog';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteResourceCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCatalog';
  context.operationId = 'deleteResourceCatalog';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { listResourceCatalog, createResourceCatalog, retrieveResourceCatalog, patchResourceCatalog, deleteResourceCatalog };
