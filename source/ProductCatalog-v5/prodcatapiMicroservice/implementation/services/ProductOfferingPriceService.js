'use strict';
const Service = require('./Service');

const listProductOfferingPrice = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOfferingPrice';
  context.operationId = 'listProductOfferingPrice';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createProductOfferingPrice = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOfferingPrice';
  context.operationId = 'createProductOfferingPrice';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveProductOfferingPrice = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOfferingPrice';
  context.operationId = 'retrieveProductOfferingPrice';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchProductOfferingPrice = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOfferingPrice';
  context.operationId = 'patchProductOfferingPrice';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteProductOfferingPrice = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductOfferingPrice';
  context.operationId = 'deleteProductOfferingPrice';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listProductOfferingPrice, createProductOfferingPrice, retrieveProductOfferingPrice, patchProductOfferingPrice, deleteProductOfferingPrice };
