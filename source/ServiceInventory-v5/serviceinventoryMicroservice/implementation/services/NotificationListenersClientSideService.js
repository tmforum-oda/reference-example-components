'use strict';
const Service = require('./Service');

const serviceAttributeValueChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'serviceAttributeValueChangeEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const serviceCreateEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'serviceCreateEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const serviceDeleteEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'serviceDeleteEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const serviceOperatingStatusChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'serviceOperatingStatusChangeEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const serviceStateChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'serviceStateChangeEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = {
  serviceAttributeValueChangeEvent,
  serviceCreateEvent,
  serviceDeleteEvent,
  serviceOperatingStatusChangeEvent,
  serviceStateChangeEvent,
};
