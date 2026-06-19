'use strict';
const Service = require('./Service');

const listResourceCandidate = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCandidate';
  context.operationId = 'listResourceCandidate';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const createResourceCandidate = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCandidate';
  context.operationId = 'createResourceCandidate';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveResourceCandidate = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCandidate';
  context.operationId = 'retrieveResourceCandidate';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchResourceCandidate = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCandidate';
  context.operationId = 'patchResourceCandidate';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteResourceCandidate = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ResourceCandidate';
  context.operationId = 'deleteResourceCandidate';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { listResourceCandidate, createResourceCandidate, retrieveResourceCandidate, patchResourceCandidate, deleteResourceCandidate };
