'use strict';
const Service = require('./Service');
const { validateRelatedProductSpecificationHref } = require('../utils/ruleUtils');

function toTMFError(e) {
  if (e?.code !== undefined && e?.error !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.code), reason: e.error?.reason || e.error?.message || 'Error' }, code: e.code };
  }
  if (e?.statusCode !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.statusCode), reason: e.reason || e.message || 'Error' }, code: e.statusCode };
  }
  return { payload: { '@type': 'Error', code: '500', reason: e?.message || 'Internal Server Error' }, code: 500 };
}

const createProductTestSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecification';
  context.operationId = 'createProductTestSpecification';
  context.method      = 'post';
  try {
    if (args.body) await validateRelatedProductSpecificationHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});

const listProductTestSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecification';
  context.operationId = 'listProductTestSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

const retrieveProductTestSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecification';
  context.operationId = 'retrieveProductTestSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

const patchProductTestSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecification';
  context.operationId = 'patchProductTestSpecification';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

const deleteProductTestSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecification';
  context.operationId = 'deleteProductTestSpecification';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

module.exports = {
  createProductTestSpecification,
  listProductTestSpecification,
  retrieveProductTestSpecification,
  patchProductTestSpecification,
  deleteProductTestSpecification,
};
