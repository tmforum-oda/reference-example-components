'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenerService');

const ackAlarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.ackAlarmCreateEvent);
};
const ackAlarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.ackAlarmStateChangeEvent);
};
const alarmAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.alarmAttributeValueChangeEvent);
};
const alarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.alarmCreateEvent);
};
const alarmDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.alarmDeleteEvent);
};
const alarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.alarmStateChangeEvent);
};
const clearAlarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.clearAlarmCreateEvent);
};
const clearAlarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.clearAlarmStateChangeEvent);
};
const commentAlarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.commentAlarmCreateEvent);
};
const commentAlarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.commentAlarmStateChangeEvent);
};
const groupAlarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.groupAlarmCreateEvent);
};
const groupAlarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.groupAlarmStateChangeEvent);
};
const unAckAlarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.unAckAlarmCreateEvent);
};
const unAckAlarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.unAckAlarmStateChangeEvent);
};
const unGroupAlarmCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.unGroupAlarmCreateEvent);
};
const unGroupAlarmStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.unGroupAlarmStateChangeEvent);
};

module.exports = {
  ackAlarmCreateEvent,
  ackAlarmStateChangeEvent,
  alarmAttributeValueChangeEvent,
  alarmCreateEvent,
  alarmDeleteEvent,
  alarmStateChangeEvent,
  clearAlarmCreateEvent,
  clearAlarmStateChangeEvent,
  commentAlarmCreateEvent,
  commentAlarmStateChangeEvent,
  groupAlarmCreateEvent,
  groupAlarmStateChangeEvent,
  unAckAlarmCreateEvent,
  unAckAlarmStateChangeEvent,
  unGroupAlarmCreateEvent,
  unGroupAlarmStateChangeEvent
};
