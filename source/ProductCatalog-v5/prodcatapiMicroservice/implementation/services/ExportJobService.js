'use strict';
const Service = require('./Service');

const listExportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ExportJob';
  context.operationId = 'listExportJob';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createExportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ExportJob';
  context.operationId = 'createExportJob';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveExportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ExportJob';
  context.operationId = 'retrieveExportJob';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteExportJob = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ExportJob';
  context.operationId = 'deleteExportJob';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listExportJob, createExportJob, retrieveExportJob, deleteExportJob };
