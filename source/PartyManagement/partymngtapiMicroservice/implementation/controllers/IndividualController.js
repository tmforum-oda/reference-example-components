'use strict';
const Controller = require('./Controller');
const service = require('../services/IndividualService');

const listIndividual = async (request, response) => {
  await Controller.handleRequest(request, response, service.listIndividual);
};
const createIndividual = async (request, response) => {
  await Controller.handleRequest(request, response, service.createIndividual);
};
const retrieveIndividual = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveIndividual);
};
const patchIndividual = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchIndividual);
};
const deleteIndividual = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteIndividual);
};

module.exports = { listIndividual, createIndividual, retrieveIndividual, patchIndividual, deleteIndividual };
