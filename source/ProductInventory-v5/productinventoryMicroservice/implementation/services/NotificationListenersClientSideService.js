'use strict';
const Service = require('./Service');

const productAttributeValueChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'productAttributeValueChangeEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const productCreateEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'productCreateEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const productDeleteEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'productDeleteEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const productProductBatchEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'productProductBatchEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const productStateChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = 'productStateChangeEvent';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = {
  productAttributeValueChangeEvent,
  productCreateEvent,
  productDeleteEvent,
  productProductBatchEvent,
  productStateChangeEvent,
};
