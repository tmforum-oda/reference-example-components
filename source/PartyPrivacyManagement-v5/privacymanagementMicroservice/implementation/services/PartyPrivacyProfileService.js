'use strict';
const Service = require('./Service');

const listPartyPrivacyProfile = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfile';
  context.operationId = 'listPartyPrivacyProfile';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createPartyPrivacyProfile = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfile';
  context.operationId = 'createPartyPrivacyProfile';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrievePartyPrivacyProfile = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfile';
  context.operationId = 'retrievePartyPrivacyProfile';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchPartyPrivacyProfile = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfile';
  context.operationId = 'patchPartyPrivacyProfile';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deletePartyPrivacyProfile = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyPrivacyProfile';
  context.operationId = 'deletePartyPrivacyProfile';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = {
  listPartyPrivacyProfile,
  createPartyPrivacyProfile,
  retrievePartyPrivacyProfile,
  patchPartyPrivacyProfile,
  deletePartyPrivacyProfile,
};
