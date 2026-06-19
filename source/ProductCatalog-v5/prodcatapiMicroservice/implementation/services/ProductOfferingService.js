'use strict';
const Service = require('./Service');

const listProductOffering = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOffering';
  context.operationId = 'listProductOffering';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createProductOffering = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOffering';
  context.operationId = 'createProductOffering';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveProductOffering = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOffering';
  context.operationId = 'retrieveProductOffering';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchProductOffering = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOffering';
  context.operationId = 'patchProductOffering';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteProductOffering = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOffering';
  context.operationId = 'deleteProductOffering';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listProductOffering, createProductOffering, retrieveProductOffering, patchProductOffering, deleteProductOffering };
