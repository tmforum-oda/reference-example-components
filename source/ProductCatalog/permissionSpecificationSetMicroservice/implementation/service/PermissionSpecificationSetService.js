'use strict';

const util = require('util');
const uuid = require('uuid');

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');

const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const resourceType = 'PermissionSpecificationSet';

/**
 * Creates a PermissionSpecificationSet
 */
exports.createPermissionSpecificationSet = function(req, res, next, body, fields) {
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  swaggerUtils.getPayload(req, body)
    .then(payload => {
      payload.id = uuid.v4();
      
      // Generate component-aware href
      const resourcePath = `/permissionSpecificationSet/${payload.id}`;
      payload.href = swaggerUtils.buildComponentAwareURL(req, resourcePath);
      
      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .insertOne(payload)
          .then(() => {
            mongoUtils.sendDoc(res, 201, payload);
          })
          .catch(error => {
            console.error("createPermissionSpecificationSet: error=" + error);
            sendError(res, internalError);
          });
      })
      .catch(error => {
        console.error("createPermissionSpecificationSet: error=" + error);
        sendError(res, internalError);
      });
    })
    .catch(error => {
      console.error("createPermissionSpecificationSet: error=" + error);
      sendError(res, error);
    });
};

/**
 * Deletes a PermissionSpecificationSet
 */
exports.deletePermissionSpecificationSet = function(req, res, next, id) {
  const query = { id: id };

 
  const resourceType = 'PermissionSpecificationSet';



  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .deleteOne(query)
      .then(doc => {
        if (doc.result.n == 1) {
          mongoUtils.sendDoc(res, 204, {});
        } else {
          sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
        }
      })
      .catch(error => sendError(res, internalError));
  })
  .catch(error => sendError(res, internalError));
};

/**
 * List or find PermissionSpecificationSet objects
 */
exports.listPermissionSpecificationSet = function(req, res, next) {
  console.log("listPermissionSpecificationSet");
  console.log("req body: " + JSON.stringify(req.body));
  const query = mongoUtils.getMongoQuery(req);
  
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  console.log("listPermissionSpecificationSet: query=" + util.inspect(query, {depth: null}));
  console.log("resourceType=" + resourceType);

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .find(query.criteria, query.options).toArray()
      .then(doc => {
        // Add component-aware href to each document if not present
        console.log("listPermissionSpecificationSet: found " + doc.length + " documents");

        if (Array.isArray(doc)) {
          doc.forEach(item => {
            console.log("listPermissionSpecificationSet: item=" + JSON.stringify(item));
            if (item.id && !item.href) {
              const resourcePath = `/permissionSpecificationSet/${item.id}`;
              item.href = swaggerUtils.buildComponentAwareURL(req, resourcePath);
            }
          });
        }
        mongoUtils.sendDoc(res, 200, doc);
      })
      .catch(error => {
        console.error("listPermissionSpecificationSet: error=" + error);
        sendError(res, internalError);
      });
  })
  .catch(error => {
    console.error("listPermissionSpecificationSet: error=" + error);
    sendError(res, internalError);
  });
};

/**
 * Updates partially a PermissionSpecificationSet
 */
exports.patchPermissionSpecificationSet = function(req, res, next, body, fields, id) {
  const query = { id: id };
  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  swaggerUtils.getPayload(req, body)
    .then(payload => {
      mongoUtils.connect().then(db => {
        // First check if resource exists
        db.collection(resourceType)
          .findOne(query)
          .then(old => {
            if (old == undefined) {
              return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id"));
            }

            // Update the resource
            db.collection(resourceType)
              .updateOne(query, { $set: payload }, { upsert: false })
              .then(() => {
                db.collection(resourceType).findOne(query)
                  .then(doc => {
                    // Add component-aware href if not present
                    if (doc && doc.id && !doc.href) {
                      const resourcePath = `/permissionSpecificationSet/${doc.id}`;
                      doc.href = swaggerUtils.buildComponentAwareURL(req, resourcePath);
                    }
                    mongoUtils.sendDoc(res, 200, doc);
                  })
                  .catch(error => {
                    console.error("patchPermissionSpecificationSet error=" + error);
                    return sendError(res, internalError);
                  });
              })
              .catch(error => {
                console.error("patchPermissionSpecificationSet error=" + error);
                return sendError(res, internalError);
              });
          })
          .catch(error => {
            console.error("patchPermissionSpecificationSet error=" + error);
            return sendError(res, internalError);
          });
      })
      .catch(error => {
        console.error("patchPermissionSpecificationSet error=" + error);
        return sendError(res, internalError);
      });
    })
    .catch(error => {
      console.error("patchPermissionSpecificationSet error=" + error);
      return sendError(res, error);
    });
};

/**
 * Retrieves a PermissionSpecificationSet by ID
 */
exports.retrievePermissionSpecificationSet = function(req, res, next, fields, id) {
  const query = mongoUtils.getMongoQuery(req);
  query.criteria.id = id;

  const internalError = new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .findOne(query.criteria, query.options)
      .then(doc => {
        if (doc) {
          // Add component-aware href if not present
          if (doc.id && !doc.href) {
            const resourcePath = `/permissionSpecificationSet/${doc.id}`;
            doc.href = swaggerUtils.buildComponentAwareURL(req, resourcePath);
          }
          mongoUtils.sendDoc(res, 200, doc);
        } else {
          sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND, "No resource with given id found"));
        }
      })
      .catch(error => {
        console.error("retrievePermissionSpecificationSet: error=" + error);
        sendError(res, internalError);
      });
  })
  .catch(error => {
    console.error("retrievePermissionSpecificationSet: error=" + error);
    sendError(res, internalError);
  });
};

