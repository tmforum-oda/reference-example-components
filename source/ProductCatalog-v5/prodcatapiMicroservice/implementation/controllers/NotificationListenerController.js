'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenerService');

const categoryAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.categoryAttributeValueChangeEvent);
};
const categoryCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.categoryCreateEvent);
};
const categoryDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.categoryDeleteEvent);
};
const categoryStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.categoryStateChangeEvent);
};
const exportJobCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.exportJobCreateEvent);
};
const exportJobStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.exportJobStateChangeEvent);
};
const importJobCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.importJobCreateEvent);
};
const importJobStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.importJobStateChangeEvent);
};
const productCatalogAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productCatalogAttributeValueChangeEvent);
};
const productCatalogCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productCatalogCreateEvent);
};
const productCatalogDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productCatalogDeleteEvent);
};
const productCatalogStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productCatalogStateChangeEvent);
};
const productOfferingAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingAttributeValueChangeEvent);
};
const productOfferingCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingCreateEvent);
};
const productOfferingDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingDeleteEvent);
};
const productOfferingStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingStateChangeEvent);
};
const productOfferingPriceAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingPriceAttributeValueChangeEvent);
};
const productOfferingPriceCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingPriceCreateEvent);
};
const productOfferingPriceDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingPriceDeleteEvent);
};
const productOfferingPriceStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productOfferingPriceStateChangeEvent);
};
const productSpecificationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productSpecificationAttributeValueChangeEvent);
};
const productSpecificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productSpecificationCreateEvent);
};
const productSpecificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productSpecificationDeleteEvent);
};
const productSpecificationStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productSpecificationStateChangeEvent);
};

module.exports = {
  categoryAttributeValueChangeEvent, categoryCreateEvent, categoryDeleteEvent, categoryStateChangeEvent,
  exportJobCreateEvent, exportJobStateChangeEvent,
  importJobCreateEvent, importJobStateChangeEvent,
  productCatalogAttributeValueChangeEvent, productCatalogCreateEvent, productCatalogDeleteEvent, productCatalogStateChangeEvent,
  productOfferingAttributeValueChangeEvent, productOfferingCreateEvent, productOfferingDeleteEvent, productOfferingStateChangeEvent,
  productOfferingPriceAttributeValueChangeEvent, productOfferingPriceCreateEvent, productOfferingPriceDeleteEvent, productOfferingPriceStateChangeEvent,
  productSpecificationAttributeValueChangeEvent, productSpecificationCreateEvent, productSpecificationDeleteEvent, productSpecificationStateChangeEvent,
};
