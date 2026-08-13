'use strict';
const Service = require('./Service');
const { validateEngagedPartyHref } = require('../utils/ruleUtils');

const listPartyPrivacyAgreement = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyAgreement';
  context.operationId = 'listPartyPrivacyAgreement';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createPartyPrivacyAgreement = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyAgreement';
  context.operationId = 'createPartyPrivacyAgreement';
  context.method      = 'post';
  try {
    if (args.body) await validateEngagedPartyHref(args.body);
    resolve(await Service.serve(args, context));
  } catch (e) {
    if (e?.code !== undefined && e?.error !== undefined) resolve(e);
    else resolve(Service.rejectResponse(e));
  }
});

const retrievePartyPrivacyAgreement = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyAgreement';
  context.operationId = 'retrievePartyPrivacyAgreement';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchPartyPrivacyAgreement = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyAgreement';
  context.operationId = 'patchPartyPrivacyAgreement';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deletePartyPrivacyAgreement = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyAgreement';
  context.operationId = 'deletePartyPrivacyAgreement';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = {
  listPartyPrivacyAgreement,
  createPartyPrivacyAgreement,
  retrievePartyPrivacyAgreement,
  patchPartyPrivacyAgreement,
  deletePartyPrivacyAgreement,
};
