'use strict';
const Service = require('./Service');

const createHub = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'EventsSubscription';
  context.operationId = 'createHub';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const hubDelete = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'EventsSubscription';
  context.operationId = 'hubDelete';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { createHub, hubDelete };
