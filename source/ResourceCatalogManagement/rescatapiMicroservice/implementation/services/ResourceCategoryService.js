'use strict';
const Service = require('./Service');

const listResourceCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCategory';
  context.operationId = 'listResourceCategory';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const createResourceCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCategory';
  context.operationId = 'createResourceCategory';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveResourceCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCategory';
  context.operationId = 'retrieveResourceCategory';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchResourceCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCategory';
  context.operationId = 'patchResourceCategory';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteResourceCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCategory';
  context.operationId = 'deleteResourceCategory';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { listResourceCategory, createResourceCategory, retrieveResourceCategory, patchResourceCategory, deleteResourceCategory };
