'use strict';

// Create and patch for the five TMF620 resources, on TMF620 v5 storage (issue #87).
// Shared by CatalogService, CategoryService, ProductOfferingService,
// ProductOfferingPriceService and ProductSpecificationService.

const mongoUtils = require('./mongoUtils');
const swaggerUtils = require('./swaggerUtils');
const notificationUtils = require('./notificationUtils');
const storage = require('./tmf620Storage');

const {sendDoc} = require('./mongoUtils');
const {traverse, processCommonAttributes} = require('./operationsUtils');
const {validateRequest} = require('./ruleUtils');
const {processAssignmentRules} = require('./operations');
const {getPayloadType, getPayloadSchema, getResponseType, cleanPayloadServiceType} = require('./swaggerUtils');
const {TError, TErrorEnum, sendError} = require('./errorUtils');

function respond(res, code, resource, operation, view) {
  const warnings = storage.warningCollector(resource, operation);
  warnings.add(view.warnings, view.doc.id);
  warnings.apply(res);
  sendDoc(res, code, cleanPayloadServiceType(view.doc));
}

async function createResource(req, res, operationId) {
  const resourceType = getResponseType(req);
  const resource = storage.resourceOf(resourceType);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  let payload;
  try {
    payload = await swaggerUtils.getPayload(req);
    payload = await validateRequest(req, operationId, payload);
    payload = await traverse(req, requestSchema, payload, [], getPayloadType(req));
    payload = await processCommonAttributes(req, resourceType, payload);
    payload = await processAssignmentRules(operationId, payload);
  } catch (error) {
    console.log(operationId + ": error=" + error.toString());
    return sendError(res, error);
  }

  const serviceType = swaggerUtils.updatePayloadServiceType({}, req, '')._serviceType;
  const converted = storage.toStorage(resource, payload);
  if (converted.problems.length) {
    return storage.sendProblems(res, converted.problems, resource, payload.id, 'create');
  }
  const doc = converted.doc;
  if (serviceType !== undefined) doc._serviceType = serviceType;

  try {
    const db = await mongoUtils.connect();
    await db.collection(resourceType).insertOne(doc);
  } catch (error) {
    console.log(operationId + ": error=" + error);
    return sendError(res, internalError);
  }

  const view = storage.toV4View(resource, doc);
  view.warnings = converted.warnings.concat(view.warnings);
  respond(res, 201, resource, 'create', view);
  notificationUtils.publish(req, cleanPayloadServiceType(Object.assign({}, view.doc)));
}

async function patchResource(req, res, operationId) {
  const resourceType = getResponseType(req);
  const resource = storage.resourceOf(resourceType);
  const requestSchema = getPayloadSchema(req);
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to update resource");

  const id = String(req.swagger.params.id.value);
  const query = swaggerUtils.updateQueryServiceType({id: id}, req, 'id');

  let payload;
  try {
    payload = await swaggerUtils.getPayload(req);
    payload = await validateRequest(req, operationId, payload);
    payload = await traverse(req, requestSchema, payload, [], getPayloadType(req));
  } catch (error) {
    console.log(operationId + " error=" + error);
    return sendError(res, error);
  }

  let db, stored;
  try {
    db = await mongoUtils.connect();
    stored = await db.collection(resourceType).findOne(query);
  } catch (error) {
    console.log(operationId + " error=" + error);
    return sendError(res, internalError);
  }
  if (!stored) {
    return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id"));
  }

  const patched = storage.patchStorage(resource, stored, payload);
  if (patched.problems.length) {
    return storage.sendProblems(res, patched.problems, resource, id, 'patch');
  }
  const doc = patched.doc;
  doc.id = stored.id;
  if (stored._serviceType !== undefined) doc._serviceType = stored._serviceType;

  try {
    await db.collection(resourceType).replaceOne(query, doc, {upsert: false});
  } catch (error) {
    console.log(operationId + " error=" + error);
    return sendError(res, internalError);
  }

  const view = storage.toV4View(resource, doc);
  view.warnings = (patched.warnings || []).concat(view.warnings);
  respond(res, 200, resource, 'patch', view);
  const old = storage.toV4View(resource, stored).doc;
  notificationUtils.publish(req, cleanPayloadServiceType(Object.assign({}, view.doc)), cleanPayloadServiceType(old));
}

module.exports = { createResource, patchResource };
