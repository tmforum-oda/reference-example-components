'use strict';
const Service = require('./Service');

const listPartyRoleSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRoleSpecification';
  context.operationId = 'listPartyRoleSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createPartyRoleSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRoleSpecification';
  context.operationId = 'createPartyRoleSpecification';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrievePartyRoleSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRoleSpecification';
  context.operationId = 'retrievePartyRoleSpecification';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchPartyRoleSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRoleSpecification';
  context.operationId = 'patchPartyRoleSpecification';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deletePartyRoleSpecification = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'PartyRoleSpecification';
  context.operationId = 'deletePartyRoleSpecification';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = {
  listPartyRoleSpecification, createPartyRoleSpecification,
  retrievePartyRoleSpecification, patchPartyRoleSpecification, deletePartyRoleSpecification
};
