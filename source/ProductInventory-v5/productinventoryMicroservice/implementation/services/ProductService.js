'use strict';
const Service = require('./Service');
const { validateProductSpecHref } = require('../utils/ruleUtils');

// Service.serve may reject with an already-normalized { error, code } response.
// Preserve it so a database not-found remains HTTP 404 instead of being replaced
// by the historical generic HTTP 405 fallback.
const normalizeOperationError = (error) => {
  if (error?.code !== undefined && error?.error !== undefined) return error;
  return Service.rejectResponse(error);
};

const createProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'createProduct';
  context.method      = 'post';
  try {
    if (args.body) await validateProductSpecHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const listProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'listProduct';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const retrieveProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'retrieveProduct';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const patchProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'patchProduct';
  context.method      = 'patch';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

const deleteProduct = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Product';
  context.operationId = 'deleteProduct';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(normalizeOperationError(e));
  }
});

module.exports = { createProduct, listProduct, retrieveProduct, patchProduct, deleteProduct };
