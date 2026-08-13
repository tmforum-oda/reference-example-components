'use strict';
const Service = require('./Service');

const _notifyEvent = (eventName) => (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListener';
  context.operationId = eventName;
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const partyPrivacyAgreementAttributeValueChangeEvent       = _notifyEvent('partyPrivacyAgreementAttributeValueChangeEvent');
const partyPrivacyAgreementCreateEvent                     = _notifyEvent('partyPrivacyAgreementCreateEvent');
const partyPrivacyAgreementDeleteEvent                     = _notifyEvent('partyPrivacyAgreementDeleteEvent');
const partyPrivacyAgreementStatusChangeEvent               = _notifyEvent('partyPrivacyAgreementStatusChangeEvent');
const partyPrivacyProfileAttributeValueChangeEvent         = _notifyEvent('partyPrivacyProfileAttributeValueChangeEvent');
const partyPrivacyProfileCreateEvent                       = _notifyEvent('partyPrivacyProfileCreateEvent');
const partyPrivacyProfileDeleteEvent                       = _notifyEvent('partyPrivacyProfileDeleteEvent');
const partyPrivacyProfileSpecificationAttributeValueChangeEvent = _notifyEvent('partyPrivacyProfileSpecificationAttributeValueChangeEvent');
const partyPrivacyProfileSpecificationCreateEvent          = _notifyEvent('partyPrivacyProfileSpecificationCreateEvent');
const partyPrivacyProfileSpecificationDeleteEvent          = _notifyEvent('partyPrivacyProfileSpecificationDeleteEvent');
const partyPrivacyProfileSpecificationStatusChangeEvent    = _notifyEvent('partyPrivacyProfileSpecificationStatusChangeEvent');
const partyPrivacyProfileStatusChangeEvent                 = _notifyEvent('partyPrivacyProfileStatusChangeEvent');

module.exports = {
  partyPrivacyAgreementAttributeValueChangeEvent,
  partyPrivacyAgreementCreateEvent,
  partyPrivacyAgreementDeleteEvent,
  partyPrivacyAgreementStatusChangeEvent,
  partyPrivacyProfileAttributeValueChangeEvent,
  partyPrivacyProfileCreateEvent,
  partyPrivacyProfileDeleteEvent,
  partyPrivacyProfileSpecificationAttributeValueChangeEvent,
  partyPrivacyProfileSpecificationCreateEvent,
  partyPrivacyProfileSpecificationDeleteEvent,
  partyPrivacyProfileSpecificationStatusChangeEvent,
  partyPrivacyProfileStatusChangeEvent,
};
