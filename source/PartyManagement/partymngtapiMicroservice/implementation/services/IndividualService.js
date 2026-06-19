'use strict';
const Service = require('./Service');

const listIndividual = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Individual';
  context.operationId = 'listIndividual';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createIndividual = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Individual';
  context.operationId = 'createIndividual';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveIndividual = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Individual';
  context.operationId = 'retrieveIndividual';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchIndividual = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Individual';
  context.operationId = 'patchIndividual';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteIndividual = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Individual';
  context.operationId = 'deleteIndividual';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listIndividual, createIndividual, retrieveIndividual, patchIndividual, deleteIndividual };
