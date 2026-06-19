'use strict';
const Service = require('./Service');

const _notifyEvent = (eventName) => (args, context) => new Promise(async (resolve) => {
  context.classname   = 'NotificationListener';
  context.operationId = eventName;
  context.method      = 'post';
  try { resolve(await Service.serve(args, context)); }
  catch (e) { resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405)); }
});

const categoryAttributeValueChangeEvent       = _notifyEvent('categoryAttributeValueChangeEvent');
const categoryCreateEvent                     = _notifyEvent('categoryCreateEvent');
const categoryDeleteEvent                     = _notifyEvent('categoryDeleteEvent');
const categoryStateChangeEvent                = _notifyEvent('categoryStateChangeEvent');
const exportJobCreateEvent                    = _notifyEvent('exportJobCreateEvent');
const exportJobStateChangeEvent               = _notifyEvent('exportJobStateChangeEvent');
const importJobCreateEvent                    = _notifyEvent('importJobCreateEvent');
const importJobStateChangeEvent               = _notifyEvent('importJobStateChangeEvent');
const productCatalogAttributeValueChangeEvent = _notifyEvent('productCatalogAttributeValueChangeEvent');
const productCatalogCreateEvent               = _notifyEvent('productCatalogCreateEvent');
const productCatalogDeleteEvent               = _notifyEvent('productCatalogDeleteEvent');
const productCatalogStateChangeEvent          = _notifyEvent('productCatalogStateChangeEvent');
const productOfferingAttributeValueChangeEvent = _notifyEvent('productOfferingAttributeValueChangeEvent');
const productOfferingCreateEvent              = _notifyEvent('productOfferingCreateEvent');
const productOfferingDeleteEvent              = _notifyEvent('productOfferingDeleteEvent');
const productOfferingStateChangeEvent         = _notifyEvent('productOfferingStateChangeEvent');
const productOfferingPriceAttributeValueChangeEvent = _notifyEvent('productOfferingPriceAttributeValueChangeEvent');
const productOfferingPriceCreateEvent         = _notifyEvent('productOfferingPriceCreateEvent');
const productOfferingPriceDeleteEvent         = _notifyEvent('productOfferingPriceDeleteEvent');
const productOfferingPriceStateChangeEvent    = _notifyEvent('productOfferingPriceStateChangeEvent');
const productSpecificationAttributeValueChangeEvent = _notifyEvent('productSpecificationAttributeValueChangeEvent');
const productSpecificationCreateEvent         = _notifyEvent('productSpecificationCreateEvent');
const productSpecificationDeleteEvent         = _notifyEvent('productSpecificationDeleteEvent');
const productSpecificationStateChangeEvent    = _notifyEvent('productSpecificationStateChangeEvent');

module.exports = {
  categoryAttributeValueChangeEvent, categoryCreateEvent, categoryDeleteEvent, categoryStateChangeEvent,
  exportJobCreateEvent, exportJobStateChangeEvent,
  importJobCreateEvent, importJobStateChangeEvent,
  productCatalogAttributeValueChangeEvent, productCatalogCreateEvent, productCatalogDeleteEvent, productCatalogStateChangeEvent,
  productOfferingAttributeValueChangeEvent, productOfferingCreateEvent, productOfferingDeleteEvent, productOfferingStateChangeEvent,
  productOfferingPriceAttributeValueChangeEvent, productOfferingPriceCreateEvent, productOfferingPriceDeleteEvent, productOfferingPriceStateChangeEvent,
  productSpecificationAttributeValueChangeEvent, productSpecificationCreateEvent, productSpecificationDeleteEvent, productSpecificationStateChangeEvent,
};
