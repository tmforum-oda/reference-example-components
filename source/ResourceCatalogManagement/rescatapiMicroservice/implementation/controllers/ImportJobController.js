'use strict';
const Controller = require('./Controller');
const service = require('../services/ImportJobService');

const listImportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.listImportJob);
};
const createImportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.createImportJob);
};
const retrieveImportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveImportJob);
};
const deleteImportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteImportJob);
};

module.exports = { listImportJob, createImportJob, retrieveImportJob, deleteImportJob };
