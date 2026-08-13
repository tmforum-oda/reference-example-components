'use strict';
const Controller = require('./Controller');
const service = require('../services/CheckServiceQualificationService');

const listCheckServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listCheckServiceQualification);
};
const createCheckServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createCheckServiceQualification);
};
const retrieveCheckServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveCheckServiceQualification);
};
const patchCheckServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchCheckServiceQualification);
};
const deleteCheckServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteCheckServiceQualification);
};

module.exports = {
  listCheckServiceQualification,
  createCheckServiceQualification,
  retrieveCheckServiceQualification,
  patchCheckServiceQualification,
  deleteCheckServiceQualification
};
