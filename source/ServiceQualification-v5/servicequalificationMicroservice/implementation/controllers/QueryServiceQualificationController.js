'use strict';
const Controller = require('./Controller');
const service = require('../services/QueryServiceQualificationService');

const listQueryServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listQueryServiceQualification);
};
const createQueryServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createQueryServiceQualification);
};
const retrieveQueryServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveQueryServiceQualification);
};
const patchQueryServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchQueryServiceQualification);
};
const deleteQueryServiceQualification = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteQueryServiceQualification);
};

module.exports = {
  listQueryServiceQualification,
  createQueryServiceQualification,
  retrieveQueryServiceQualification,
  patchQueryServiceQualification,
  deleteQueryServiceQualification
};
