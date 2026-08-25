'use strict';
const Service = require('./Service');

const createCommentAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CommentAlarm';
  context.operationId = 'createCommentAlarm';
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const listCommentAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CommentAlarm';
  context.operationId = 'listCommentAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const retrieveCommentAlarm = (args, context) => new Promise(async (resolve) => {
  context.classname   = 'CommentAlarm';
  context.operationId = 'retrieveCommentAlarm';
  context.method      = 'get';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

module.exports = { createCommentAlarm, listCommentAlarm, retrieveCommentAlarm };
