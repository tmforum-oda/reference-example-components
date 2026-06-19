'use strict';
const Service = require('./Service');

const makeListener = (operationId, classname) => (args, context) => new Promise(async (resolve) => {
  context.classname   = classname;
  context.operationId = operationId;
  context.method      = 'post';
  try {
    resolve(await Service.serve(args, context));
  } catch (e) {
    resolve(Service.rejectResponse(e.message || 'Invalid input', e.status || 405));
  }
});

const exportJobCreateEvent                          = makeListener('exportJobCreateEvent', 'ExportJobCreateEvent');
const exportJobDeleteEvent                          = makeListener('exportJobDeleteEvent', 'ExportJobDeleteEvent');
const exportJobStateChangeEvent                     = makeListener('exportJobStateChangeEvent', 'ExportJobStateChangeEvent');
const importJobCreateEvent                          = makeListener('importJobCreateEvent', 'ImportJobCreateEvent');
const importJobDeleteEvent                          = makeListener('importJobDeleteEvent', 'ImportJobDeleteEvent');
const importJobStateChangeEvent                     = makeListener('importJobStateChangeEvent', 'ImportJobStateChangeEvent');
const resourceCandidateAttributeValueChangeEvent    = makeListener('resourceCandidateAttributeValueChangeEvent', 'ResourceCandidateAttributeValueChangeEvent');
const resourceCandidateCreateEvent                  = makeListener('resourceCandidateCreateEvent', 'ResourceCandidateCreateEvent');
const resourceCandidateDeleteEvent                  = makeListener('resourceCandidateDeleteEvent', 'ResourceCandidateDeleteEvent');
const resourceCandidateStatusChangeEvent            = makeListener('resourceCandidateStatusChangeEvent', 'ResourceCandidateStatusChangeEvent');
const resourceCatalogAttributeValueChangeEvent      = makeListener('resourceCatalogAttributeValueChangeEvent', 'ResourceCatalogAttributeValueChangeEvent');
const resourceCatalogCreateEvent                    = makeListener('resourceCatalogCreateEvent', 'ResourceCatalogCreateEvent');
const resourceCatalogDeleteEvent                    = makeListener('resourceCatalogDeleteEvent', 'ResourceCatalogDeleteEvent');
const resourceCatalogStatusChangeEvent              = makeListener('resourceCatalogStatusChangeEvent', 'ResourceCatalogStatusChangeEvent');
const resourceCategoryAttributeValueChangeEvent     = makeListener('resourceCategoryAttributeValueChangeEvent', 'ResourceCategoryAttributeValueChangeEvent');
const resourceCategoryCreateEvent                   = makeListener('resourceCategoryCreateEvent', 'ResourceCategoryCreateEvent');
const resourceCategoryDeleteEvent                   = makeListener('resourceCategoryDeleteEvent', 'ResourceCategoryDeleteEvent');
const resourceCategoryStatusChangeEvent             = makeListener('resourceCategoryStatusChangeEvent', 'ResourceCategoryStatusChangeEvent');
const resourceSpecificationAttributeValueChangeEvent = makeListener('resourceSpecificationAttributeValueChangeEvent', 'ResourceSpecificationAttributeValueChangeEvent');
const resourceSpecificationCreateEvent              = makeListener('resourceSpecificationCreateEvent', 'ResourceSpecificationCreateEvent');
const resourceSpecificationDeleteEvent              = makeListener('resourceSpecificationDeleteEvent', 'ResourceSpecificationDeleteEvent');
const resourceSpecificationStatusChangeEvent        = makeListener('resourceSpecificationStatusChangeEvent', 'ResourceSpecificationStatusChangeEvent');

module.exports = {
  exportJobCreateEvent, exportJobDeleteEvent, exportJobStateChangeEvent,
  importJobCreateEvent, importJobDeleteEvent, importJobStateChangeEvent,
  resourceCandidateAttributeValueChangeEvent, resourceCandidateCreateEvent, resourceCandidateDeleteEvent, resourceCandidateStatusChangeEvent,
  resourceCatalogAttributeValueChangeEvent, resourceCatalogCreateEvent, resourceCatalogDeleteEvent, resourceCatalogStatusChangeEvent,
  resourceCategoryAttributeValueChangeEvent, resourceCategoryCreateEvent, resourceCategoryDeleteEvent, resourceCategoryStatusChangeEvent,
  resourceSpecificationAttributeValueChangeEvent, resourceSpecificationCreateEvent, resourceSpecificationDeleteEvent, resourceSpecificationStatusChangeEvent,
};
