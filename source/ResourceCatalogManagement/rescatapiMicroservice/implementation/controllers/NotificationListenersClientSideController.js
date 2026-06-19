'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenersClientSideService');

const exportJobCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.exportJobCreateEvent);
};
const exportJobDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.exportJobDeleteEvent);
};
const exportJobStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.exportJobStateChangeEvent);
};
const importJobCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.importJobCreateEvent);
};
const importJobDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.importJobDeleteEvent);
};
const importJobStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.importJobStateChangeEvent);
};
const resourceCandidateAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCandidateAttributeValueChangeEvent);
};
const resourceCandidateCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCandidateCreateEvent);
};
const resourceCandidateDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCandidateDeleteEvent);
};
const resourceCandidateStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCandidateStatusChangeEvent);
};
const resourceCatalogAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCatalogAttributeValueChangeEvent);
};
const resourceCatalogCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCatalogCreateEvent);
};
const resourceCatalogDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCatalogDeleteEvent);
};
const resourceCatalogStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCatalogStatusChangeEvent);
};
const resourceCategoryAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCategoryAttributeValueChangeEvent);
};
const resourceCategoryCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCategoryCreateEvent);
};
const resourceCategoryDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCategoryDeleteEvent);
};
const resourceCategoryStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceCategoryStatusChangeEvent);
};
const resourceSpecificationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceSpecificationAttributeValueChangeEvent);
};
const resourceSpecificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceSpecificationCreateEvent);
};
const resourceSpecificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceSpecificationDeleteEvent);
};
const resourceSpecificationStatusChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.resourceSpecificationStatusChangeEvent);
};

module.exports = {
  exportJobCreateEvent, exportJobDeleteEvent, exportJobStateChangeEvent,
  importJobCreateEvent, importJobDeleteEvent, importJobStateChangeEvent,
  resourceCandidateAttributeValueChangeEvent, resourceCandidateCreateEvent, resourceCandidateDeleteEvent, resourceCandidateStatusChangeEvent,
  resourceCatalogAttributeValueChangeEvent, resourceCatalogCreateEvent, resourceCatalogDeleteEvent, resourceCatalogStatusChangeEvent,
  resourceCategoryAttributeValueChangeEvent, resourceCategoryCreateEvent, resourceCategoryDeleteEvent, resourceCategoryStatusChangeEvent,
  resourceSpecificationAttributeValueChangeEvent, resourceSpecificationCreateEvent, resourceSpecificationDeleteEvent, resourceSpecificationStatusChangeEvent,
};
