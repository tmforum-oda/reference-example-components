'use strict';
const Service = require('./Service');

const listProductCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductCatalog';
  context.operationId = 'listProductCatalog';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createProductCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductCatalog';
  context.operationId = 'createProductCatalog';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveProductCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductCatalog';
  context.operationId = 'retrieveProductCatalog';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchProductCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductCatalog';
  context.operationId = 'patchProductCatalog';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteProductCatalog = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductCatalog';
  context.operationId = 'deleteProductCatalog';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listProductCatalog, createProductCatalog, retrieveProductCatalog, patchProductCatalog, deleteProductCatalog };
