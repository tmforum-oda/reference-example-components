'use strict';
const Service = require('./Service');

const listImportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ImportJob';
  context.operationId = 'listImportJob';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const createImportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ImportJob';
  context.operationId = 'createImportJob';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveImportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ImportJob';
  context.operationId = 'retrieveImportJob';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteImportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ImportJob';
  context.operationId = 'deleteImportJob';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { listImportJob, createImportJob, retrieveImportJob, deleteImportJob };
