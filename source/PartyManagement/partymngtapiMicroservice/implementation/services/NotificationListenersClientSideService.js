'use strict';
const Service = require('./Service');

const _notifyEvent = (eventName) => (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = eventName;
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const individualAttributeValueChangeEvent       = _notifyEvent('individualAttributeValueChangeEvent');
const individualCreateEvent                     = _notifyEvent('individualCreateEvent');
const individualDeleteEvent                     = _notifyEvent('individualDeleteEvent');
const individualStateChangeEvent                = _notifyEvent('individualStateChangeEvent');
const organizationAttributeValueChangeEvent     = _notifyEvent('organizationAttributeValueChangeEvent');
const organizationCreateEvent                   = _notifyEvent('organizationCreateEvent');
const organizationDeleteEvent                   = _notifyEvent('organizationDeleteEvent');
const organizationStateChangeEvent              = _notifyEvent('organizationStateChangeEvent');

module.exports = {
  individualAttributeValueChangeEvent, individualCreateEvent, individualDeleteEvent, individualStateChangeEvent,
  organizationAttributeValueChangeEvent, organizationCreateEvent, organizationDeleteEvent, organizationStateChangeEvent,
};
