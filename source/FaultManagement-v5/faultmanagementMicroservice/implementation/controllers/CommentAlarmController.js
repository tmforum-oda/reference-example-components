'use strict';
const Controller = require('./Controller');
const service = require('../services/CommentAlarmService');

const createCommentAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.createCommentAlarm);
};
const listCommentAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.listCommentAlarm);
};
const retrieveCommentAlarm = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveCommentAlarm);
};

module.exports = { createCommentAlarm, listCommentAlarm, retrieveCommentAlarm };
