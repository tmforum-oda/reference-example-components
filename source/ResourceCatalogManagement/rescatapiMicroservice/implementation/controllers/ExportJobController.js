'use strict';
const Controller = require('./Controller');
const service = require('../services/ExportJobService');

const listExportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.listExportJob);
};
const createExportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.createExportJob);
};
const retrieveExportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveExportJob);
};
const deleteExportJob = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteExportJob);
};

module.exports = { listExportJob, createExportJob, retrieveExportJob, deleteExportJob };
