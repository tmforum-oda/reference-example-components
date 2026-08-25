'use strict';
const Service = require('./Service');

const _notifyEvent = (eventName) => (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListener';
  context.operationId = eventName;
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const ackAlarmCreateEvent            = _notifyEvent('ackAlarmCreateEvent');
const ackAlarmStateChangeEvent       = _notifyEvent('ackAlarmStateChangeEvent');
const alarmAttributeValueChangeEvent = _notifyEvent('alarmAttributeValueChangeEvent');
const alarmCreateEvent               = _notifyEvent('alarmCreateEvent');
const alarmDeleteEvent               = _notifyEvent('alarmDeleteEvent');
const alarmStateChangeEvent          = _notifyEvent('alarmStateChangeEvent');
const clearAlarmCreateEvent          = _notifyEvent('clearAlarmCreateEvent');
const clearAlarmStateChangeEvent     = _notifyEvent('clearAlarmStateChangeEvent');
const commentAlarmCreateEvent        = _notifyEvent('commentAlarmCreateEvent');
const commentAlarmStateChangeEvent   = _notifyEvent('commentAlarmStateChangeEvent');
const groupAlarmCreateEvent          = _notifyEvent('groupAlarmCreateEvent');
const groupAlarmStateChangeEvent     = _notifyEvent('groupAlarmStateChangeEvent');
const unAckAlarmCreateEvent          = _notifyEvent('unAckAlarmCreateEvent');
const unAckAlarmStateChangeEvent     = _notifyEvent('unAckAlarmStateChangeEvent');
const unGroupAlarmCreateEvent        = _notifyEvent('unGroupAlarmCreateEvent');
const unGroupAlarmStateChangeEvent   = _notifyEvent('unGroupAlarmStateChangeEvent');

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
