'use strict';
const Service = require('./Service');

const createHub = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'EventsSubscription';
  context.operationId = 'createHub';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const hubGet = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'EventsSubscription';
  context.operationId = 'hubGet';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const hubDelete = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'EventsSubscription';
  context.operationId = 'hubDelete';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

module.exports = { createHub, hubGet, hubDelete };
