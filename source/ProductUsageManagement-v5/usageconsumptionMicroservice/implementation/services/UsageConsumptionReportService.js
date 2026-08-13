'use strict';
const Service = require('./Service');

function toTMFError(e) {
  if (e?.code !== undefined && e?.error !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.code), reason: e.error?.reason || e.error?.message || 'Error' }, code: e.code };
  }
  if (e?.statusCode !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.statusCode), reason: e.reason || e.message || 'Error' }, code: e.statusCode };
  }
  return { payload: { '@type': 'Error', code: '500', reason: e?.message || 'Internal Server Error' }, code: 500 };
}

const listUsageConsumptionReport = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UsageConsumptionReport';
  context.operationId = 'listUsageConsumptionReport';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});
const createUsageConsumptionReport = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UsageConsumptionReport';
  context.operationId = 'createUsageConsumptionReport';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});
const retrieveUsageConsumptionReport = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UsageConsumptionReport';
  context.operationId = 'retrieveUsageConsumptionReport';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});
const deleteUsageConsumptionReport = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UsageConsumptionReport';
  context.operationId = 'deleteUsageConsumptionReport';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});

module.exports = {
  listUsageConsumptionReport,
  createUsageConsumptionReport,
  retrieveUsageConsumptionReport,
  deleteUsageConsumptionReport,
};
