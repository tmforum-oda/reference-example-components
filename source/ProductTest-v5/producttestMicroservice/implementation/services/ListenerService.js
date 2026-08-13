'use strict';
const Service = require('./Service');

const productTestAttributeValueChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestAttributeValueChangeEvent';
  context.operationId = 'productTestAttributeValueChangeEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const productTestCreateEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestCreateEvent';
  context.operationId = 'productTestCreateEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const productTestSpecificationAttributeValueChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecificationAttributeValueChangeEvent';
  context.operationId = 'productTestSpecificationAttributeValueChangeEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const productTestSpecificationCreateEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecificationCreateEvent';
  context.operationId = 'productTestSpecificationCreateEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const productTestSpecificationDeleteEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecificationDeleteEvent';
  context.operationId = 'productTestSpecificationDeleteEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const productTestSpecificationStateChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestSpecificationStateChangeEvent';
  context.operationId = 'productTestSpecificationStateChangeEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const productTestStateChangeEvent = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'ProductTestStateChangeEvent';
  context.operationId = 'productTestStateChangeEvent';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = {
  productTestAttributeValueChangeEvent,
  productTestCreateEvent,
  productTestSpecificationAttributeValueChangeEvent,
  productTestSpecificationCreateEvent,
  productTestSpecificationDeleteEvent,
  productTestSpecificationStateChangeEvent,
  productTestStateChangeEvent,
};
