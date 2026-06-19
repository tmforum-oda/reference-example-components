'use strict';
const Service = require('./Service');

const listResourceSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceSpecification';
  context.operationId = 'listResourceSpecification';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const createResourceSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceSpecification';
  context.operationId = 'createResourceSpecification';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveResourceSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceSpecification';
  context.operationId = 'retrieveResourceSpecification';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchResourceSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceSpecification';
  context.operationId = 'patchResourceSpecification';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteResourceSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceSpecification';
  context.operationId = 'deleteResourceSpecification';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { listResourceSpecification, createResourceSpecification, retrieveResourceSpecification, patchResourceSpecification, deleteResourceSpecification };
