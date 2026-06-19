'use strict';
const Service = require('./Service');
const { validateProductSpecHref } = require('../utils/ruleUtils');

const createProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'createProduct';
  context.method      = 'post';
  try {
    if (args.body) await validateProductSpecHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});

const listProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'listProduct';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'retrieveProduct';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const patchProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'patchProduct';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const deleteProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'deleteProduct';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createProduct, listProduct, retrieveProduct, patchProduct, deleteProduct };
