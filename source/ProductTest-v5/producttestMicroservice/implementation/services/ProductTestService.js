'use strict';
const Service = require('./Service');
const { validateRelatedProductHref } = require('../utils/ruleUtils');

function toTMFError(e) {
  if (e?.code !== undefined && e?.error !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.code), reason: e.error?.reason || e.error?.message || 'Error' }, code: e.code };
  }
  if (e?.statusCode !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.statusCode), reason: e.reason || e.message || 'Error' }, code: e.statusCode };
  }
  return { payload: { '@type': 'Error', code: '500', reason: e?.message || 'Internal Server Error' }, code: 500 };
}

const createProductTest = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTest';
  context.operationId = 'createProductTest';
  context.method      = 'post';
  try {
    if (args.body) await validateRelatedProductHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});

const listProductTest = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTest';
  context.operationId = 'listProductTest';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

const retrieveProductTest = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTest';
  context.operationId = 'retrieveProductTest';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

const patchProductTest = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTest';
  context.operationId = 'patchProductTest';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(toTMFError(e)); }
});

module.exports = {
  createProductTest,
  listProductTest,
  retrieveProductTest,
  patchProductTest,
};
