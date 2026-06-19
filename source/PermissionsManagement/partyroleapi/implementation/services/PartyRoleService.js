'use strict';
const Service = require('./Service');
const { validateEngagedPartyHref } = require('../utils/ruleUtils');

const listPartyRole = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRole';
  context.operationId = 'listPartyRole';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createPartyRole = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRole';
  context.operationId = 'createPartyRole';
  context.method      = 'post';
  try {
    if (args.body) await validateEngagedPartyHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});

const retrievePartyRole = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRole';
  context.operationId = 'retrievePartyRole';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchPartyRole = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRole';
  context.operationId = 'patchPartyRole';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deletePartyRole = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRole';
  context.operationId = 'deletePartyRole';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listPartyRole, createPartyRole, retrievePartyRole, patchPartyRole, deletePartyRole };
