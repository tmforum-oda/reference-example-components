'use strict';
const Controller = require('./Controller');
const service = require('../services/ResourceCandidateService');

const listResourceCandidate = async (request, response) => {
  await Controller.handleRequest(request, response, service.listResourceCandidate);
};
const createResourceCandidate = async (request, response) => {
  await Controller.handleRequest(request, response, service.createResourceCandidate);
};
const retrieveResourceCandidate = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveResourceCandidate);
};
const patchResourceCandidate = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchResourceCandidate);
};
const deleteResourceCandidate = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteResourceCandidate);
};

module.exports = { listResourceCandidate, createResourceCandidate, retrieveResourceCandidate, patchResourceCandidate, deleteResourceCandidate };
