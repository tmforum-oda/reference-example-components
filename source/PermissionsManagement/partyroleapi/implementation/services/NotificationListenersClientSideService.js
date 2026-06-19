'use strict';
const Service = require('./Service');

const _notifyEvent = (eventName) => (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListenersClientSide';
  context.operationId = eventName;
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const partyRoleAttributeValueChangeEvent             = _notifyEvent('partyRoleAttributeValueChangeEvent');
const partyRoleCreateEvent                           = _notifyEvent('partyRoleCreateEvent');
const partyRoleDeleteEvent                           = _notifyEvent('partyRoleDeleteEvent');
const partyRoleSpecificationAttributeValueChangeEvent = _notifyEvent('partyRoleSpecificationAttributeValueChangeEvent');
const partyRoleSpecificationCreateEvent              = _notifyEvent('partyRoleSpecificationCreateEvent');
const partyRoleSpecificationDeleteEvent              = _notifyEvent('partyRoleSpecificationDeleteEvent');
const partyRoleSpecificationStateChangeEvent         = _notifyEvent('partyRoleSpecificationStateChangeEvent');
const partyRoleStateChangeEvent                      = _notifyEvent('partyRoleStateChangeEvent');

module.exports = {
  partyRoleAttributeValueChangeEvent, partyRoleCreateEvent, partyRoleDeleteEvent,
  partyRoleSpecificationAttributeValueChangeEvent, partyRoleSpecificationCreateEvent,
  partyRoleSpecificationDeleteEvent, partyRoleSpecificationStateChangeEvent,
  partyRoleStateChangeEvent,
};
