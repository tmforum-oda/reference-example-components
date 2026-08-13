'use strict';
const Service = require('./Service');

const listQueryServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryServiceQualification';
  context.operationId = 'listQueryServiceQualification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const createQueryServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryServiceQualification';
  context.operationId = 'createQueryServiceQualification';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const retrieveQueryServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryServiceQualification';
  context.operationId = 'retrieveQueryServiceQualification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const patchQueryServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryServiceQualification';
  context.operationId = 'patchQueryServiceQualification';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const deleteQueryServiceQualification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryServiceQualification';
  context.operationId = 'deleteQueryServiceQualification';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

module.exports = {
  listQueryServiceQualification,
  createQueryServiceQualification,
  retrieveQueryServiceQualification,
  patchQueryServiceQualification,
  deleteQueryServiceQualification
};
