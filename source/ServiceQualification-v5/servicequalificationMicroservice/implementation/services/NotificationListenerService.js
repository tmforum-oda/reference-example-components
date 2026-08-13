'use strict';
const Service = require('./Service');

const _notifyEvent = (eventName) => (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListener';
  context.operationId = eventName;
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { if (e?.code !== undefined && e?.error !== undefined) resolve(e); else resolve(Service.rejectResponse(e)); }
});

const checkServiceQualificationAttributeValueChangeEvent = _notifyEvent('checkServiceQualificationAttributeValueChangeEvent');
const checkServiceQualificationCreateEvent               = _notifyEvent('checkServiceQualificationCreateEvent');
const checkServiceQualificationDeleteEvent               = _notifyEvent('checkServiceQualificationDeleteEvent');
const checkServiceQualificationInformationRequiredEvent  = _notifyEvent('checkServiceQualificationInformationRequiredEvent');
const checkServiceQualificationStateChangeEvent          = _notifyEvent('checkServiceQualificationStateChangeEvent');
const queryServiceQualificationCreateEvent               = _notifyEvent('queryServiceQualificationCreateEvent');
const queryServiceQualificationDeleteEvent               = _notifyEvent('queryServiceQualificationDeleteEvent');
const queryServiceQualificationStateChangeEvent          = _notifyEvent('queryServiceQualificationStateChangeEvent');

module.exports = {
  checkServiceQualificationAttributeValueChangeEvent,
  checkServiceQualificationCreateEvent,
  checkServiceQualificationDeleteEvent,
  checkServiceQualificationInformationRequiredEvent,
  checkServiceQualificationStateChangeEvent,
  queryServiceQualificationCreateEvent,
  queryServiceQualificationDeleteEvent,
  queryServiceQualificationStateChangeEvent
};
