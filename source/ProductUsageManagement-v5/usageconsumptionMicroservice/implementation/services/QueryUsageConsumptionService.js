'use strict';
const Service = require('./Service');
const { validatePartyOrPartyRoleHref } = require('../utils/ruleUtils');

function toTMFError(e) {
  // Service.serve() throws { error: TError, code: HTTP_STATUS }
  if (e?.code !== undefined && e?.error !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.code), reason: e.error?.reason || e.error?.message || 'Error' }, code: e.code };
  }
  // Direct TError thrown (e.g. from validatePartyOrPartyRoleHref) has .statusCode getter
  if (e?.statusCode !== undefined) {
    return { payload: { '@type': 'Error', code: String(e.statusCode), reason: e.reason || e.message || 'Error' }, code: e.statusCode };
  }
  return { payload: { '@type': 'Error', code: '500', reason: e?.message || 'Internal Server Error' }, code: 500 };
}

const createQueryUsageConsumption = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumption';
  context.operationId = 'createQueryUsageConsumption';
  context.method      = 'post';
  try {
    if (!args.body?.['@type']) {
      return resolve({ payload: { '@type': 'Error', code: '400', reason: "Required field '@type' is missing" }, code: 400 });
    }
    if (args.body) await validatePartyOrPartyRoleHref(args.body);
    const result = await Service.serve(args, context);
    if (result.code === 201) {
      try {
        const baseUrl = context.request.url.replace(/\/queryUsageConsumption(\?.*)?$/, '');
        const mockReq = Object.create(context.request);
        mockReq.url = `${baseUrl}/usageConsumptionReport`;
        mockReq.originalUrl = `${baseUrl}/usageConsumptionReport`;
        const rptContext = {
          classname: 'UsageConsumptionReport',
          operationId: 'createUsageConsumptionReport',
          method: 'post',
          request: mockReq
        };
        await Service.serve({ body: { '@type': 'UsageConsumptionReport' } }, rptContext);
      } catch (e) {
        // non-fatal side effect
      }
    }
    resolve(result);
  } catch (e) {
    resolve(toTMFError(e));
  }
});

const listQueryUsageConsumption = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumption';
  context.operationId = 'listQueryUsageConsumption';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});

const retrieveQueryUsageConsumption = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumption';
  context.operationId = 'retrieveQueryUsageConsumption';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});

const deleteQueryUsageConsumption = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumption';
  context.operationId = 'deleteQueryUsageConsumption';
  context.method      = 'delete';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(toTMFError(e));
  }
});

module.exports = {
  createQueryUsageConsumption,
  listQueryUsageConsumption,
  retrieveQueryUsageConsumption,
  deleteQueryUsageConsumption,
};
