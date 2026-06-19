'use strict';
const Service = require('./Service');

const listProductSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductSpecification';
  context.operationId = 'listProductSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createProductSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductSpecification';
  context.operationId = 'createProductSpecification';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveProductSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductSpecification';
  context.operationId = 'retrieveProductSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchProductSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductSpecification';
  context.operationId = 'patchProductSpecification';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteProductSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductSpecification';
  context.operationId = 'deleteProductSpecification';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listProductSpecification, createProductSpecification, retrieveProductSpecification, patchProductSpecification, deleteProductSpecification };
