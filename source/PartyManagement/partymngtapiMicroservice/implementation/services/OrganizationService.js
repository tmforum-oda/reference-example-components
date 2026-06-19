'use strict';
const Service = require('./Service');
const { validateRelatedPartyHref } = require('../utils/ruleUtils');

const listOrganization = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Organization';
  context.operationId = 'listOrganization';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createOrganization = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Organization';
  context.operationId = 'createOrganization';
  context.method      = 'post';
  try {
    if (args.body) await validateRelatedPartyHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});

const retrieveOrganization = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Organization';
  context.operationId = 'retrieveOrganization';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchOrganization = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Organization';
  context.operationId = 'patchOrganization';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteOrganization = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Organization';
  context.operationId = 'deleteOrganization';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listOrganization, createOrganization, retrieveOrganization, patchOrganization, deleteOrganization };
