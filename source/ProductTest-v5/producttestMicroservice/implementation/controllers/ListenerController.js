'use strict';
const Controller = require('./Controller');
const service = require('../services/ListenerService');

const productTestAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestAttributeValueChangeEvent);
};
const productTestCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestCreateEvent);
};
const productTestSpecificationAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestSpecificationAttributeValueChangeEvent);
};
const productTestSpecificationCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestSpecificationCreateEvent);
};
const productTestSpecificationDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestSpecificationDeleteEvent);
};
const productTestSpecificationStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestSpecificationStateChangeEvent);
};
const productTestStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productTestStateChangeEvent);
};

module.exports = {
  productTestAttributeValueChangeEvent,
  productTestCreateEvent,
  productTestSpecificationAttributeValueChangeEvent,
  productTestSpecificationCreateEvent,
  productTestSpecificationDeleteEvent,
  productTestSpecificationStateChangeEvent,
  productTestStateChangeEvent,
};
