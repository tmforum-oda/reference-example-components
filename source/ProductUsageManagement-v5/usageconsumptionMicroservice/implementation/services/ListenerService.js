'use strict';
const Service = require('./Service');

const queryUsageConsumptionCreateEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumptionCreateEvent';
  context.operationId = 'queryUsageConsumptionCreateEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});
const queryUsageConsumptionDeleteEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumptionDeleteEvent';
  context.operationId = 'queryUsageConsumptionDeleteEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});
const queryUsageConsumptionStateChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'QueryUsageConsumptionStateChangeEvent';
  context.operationId = 'queryUsageConsumptionStateChangeEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});
const usageConsumptionReportCreateEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UsageConsumptionReportCreateEvent';
  context.operationId = 'usageConsumptionReportCreateEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});
const usageConsumptionReportDeleteEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'UsageConsumptionReportDeleteEvent';
  context.operationId = 'usageConsumptionReportDeleteEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = {
  queryUsageConsumptionCreateEvent,
  queryUsageConsumptionDeleteEvent,
  queryUsageConsumptionStateChangeEvent,
  usageConsumptionReportCreateEvent,
  usageConsumptionReportDeleteEvent,
};
