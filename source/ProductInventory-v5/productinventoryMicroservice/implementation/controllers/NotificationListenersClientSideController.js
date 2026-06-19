'use strict';
const Controller = require('./Controller');
const service = require('../services/NotificationListenersClientSideService');

const productAttributeValueChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productAttributeValueChangeEvent);
};
const productCreateEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productCreateEvent);
};
const productDeleteEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productDeleteEvent);
};
const productProductBatchEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productProductBatchEvent);
};
const productStateChangeEvent = async (request, response) => {
  await Controller.handleRequest(request, response, service.productStateChangeEvent);
};

module.exports = {
  productAttributeValueChangeEvent,
  productCreateEvent,
  productDeleteEvent,
  productProductBatchEvent,
  productStateChangeEvent,
};
