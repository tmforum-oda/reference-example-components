'use strict';
const Service = require('./Service');
const { validateServiceSpecificationHref } = require('../utils/ruleUtils');

const listCheckServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CheckServiceQualification';
  context.operationId = 'listCheckServiceQualification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const createCheckServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CheckServiceQualification';
  context.operationId = 'createCheckServiceQualification';
  context.method      = 'post';
  try {
    if (args.body) await validateServiceSpecificationHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});

const retrieveCheckServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CheckServiceQualification';
  context.operationId = 'retrieveCheckServiceQualification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const patchCheckServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CheckServiceQualification';
  context.operationId = 'patchCheckServiceQualification';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const deleteCheckServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CheckServiceQualification';
  context.operationId = 'deleteCheckServiceQualification';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

module.exports = {
  listCheckServiceQualification,
  createCheckServiceQualification,
  retrieveCheckServiceQualification,
  patchCheckServiceQualification,
  deleteCheckServiceQualification
};
