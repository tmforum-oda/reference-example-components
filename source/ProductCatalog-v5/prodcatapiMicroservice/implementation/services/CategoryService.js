'use strict';
const Service = require('./Service');

const listCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Category';
  context.operationId = 'listCategory';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const createCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Category';
  context.operationId = 'createCategory';
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const retrieveCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Category';
  context.operationId = 'retrieveCategory';
  context.method      = 'get';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const patchCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Category';
  context.operationId = 'patchCategory';
  context.method      = 'patch';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const deleteCategory = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'Category';
  context.operationId = 'deleteCategory';
  context.method      = 'delete';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

module.exports = { listCategory, createCategory, retrieveCategory, patchCategory, deleteCategory };
