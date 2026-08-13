'use strict';
const Service = require('./Service');

const listPartyPrivacyProfileSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfileSpecification';
  context.operationId = 'listPartyPrivacyProfileSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createPartyPrivacyProfileSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfileSpecification';
  context.operationId = 'createPartyPrivacyProfileSpecification';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrievePartyPrivacyProfileSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfileSpecification';
  context.operationId = 'retrievePartyPrivacyProfileSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchPartyPrivacyProfileSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfileSpecification';
  context.operationId = 'patchPartyPrivacyProfileSpecification';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deletePartyPrivacyProfileSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfileSpecification';
  context.operationId = 'deletePartyPrivacyProfileSpecification';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = {
  listPartyPrivacyProfileSpecification,
  createPartyPrivacyProfileSpecification,
  retrievePartyPrivacyProfileSpecification,
  patchPartyPrivacyProfileSpecification,
  deletePartyPrivacyProfileSpecification,
};
