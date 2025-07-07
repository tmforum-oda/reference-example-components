'use strict';

const notificationUtils = require('../utils/notificationUtils');


/**
 * Create a subscription (hub) to receive Events
 * Sets the communication endpoint to receive Events.
 *
 * body Hub_FVO Data containing the callback endpoint to deliver the information
 * returns Hub
 **/
exports.createHub = function(req, body) {
  console.log('[HUB] createHub called with body:', JSON.stringify(body, null, 2));
  console.log('[HUB] req.url:', req.url);
  
  return new Promise((resolve, reject) => {
    if (!body) {
      return reject({
        code: 400,
        message: "Missing hub registration data"
      });
    }

    const uuid = require('uuid');
    const mongoUtils = require('../utils/mongoUtils');
    const HUB = "HUB";

    // Add required fields
    body.id = uuid.v4();
    
    // Extract service group from the request URL using the same function as notifications
    body._serviceGroup = getServiceGroup(req);
    
    console.log(`[HUB] Extracted serviceGroup from URL '${req.url}': ${body._serviceGroup}`);
    
    // Set default query if not provided
    if (!body.query) {
      body.query = "";
    }
    
    // Generate _query field for MongoDB query
    try {
      const query = mongoUtils.getMongoQuery(body.query); 
      body._query = JSON.stringify(query);
    } catch(err) {
      console.error("createHub: error processing query=" + err);
      return reject({
        code: 500,
        message: "Unable to process query"
      });
    }

    console.log(`[HUB] Registering listener with serviceGroup: ${body._serviceGroup}`);
    console.log(`[HUB] Callback URL: ${body.callback}`);
    console.log(`[HUB] Query filter: ${body.query || 'none'}`);

    mongoUtils.connect().then(db => {
      db.collection(HUB)
        .insertOne(body)
        .then(() => {
          console.log(`[HUB] Successfully registered listener with ID: ${body.id}`);
          
          // Clean the response (remove internal fields)
          const response = Object.assign({}, body);
          Object.keys(response).forEach(key => {
            if (key.startsWith("_")) {
              delete response[key];
            }
          });
          
          resolve(response);
        })
        .catch((error) => {
          console.error("[HUB] Error registering listener: " + error);
          reject({
            code: 500,
            message: "Database error"
          });
        });
    })
    .catch((error) => {
      console.error("[HUB] Database connection error: " + error);
      reject({
        code: 500,
        message: "Database error"
      });
    });
  });
}

// Helper function to extract service group from request URL (same as in notificationUtils)
function getServiceGroup(req) {
  // extract from url ala /r1-productcatalogmanagement/rolesAndPermissionsManagement/v5/hub[/:id]
  // or /r1-productcatalogmanagement/rolesAndPermissionsManagement/v5/permissionSpecificationSet[/:id]
  // we want to extract: r1-productcatalogmanagement/rolesAndPermissionsManagement/v5
  
  var parts = req.url.split("/");
  console.log(`[HUB] URL parts: ${JSON.stringify(parts)}`);
  
  // Remove empty first element (from leading /)
  parts = parts.filter(part => part !== '');
  
  // Take first 3 parts: component-name/api-name/version
  // e.g., r1-productcatalogmanagement/rolesAndPermissionsManagement/v5
  var serviceGroup = parts.slice(0, 3).join('/');
  
  console.log(`[HUB] Extracted serviceGroup: ${serviceGroup}`);
  
  return serviceGroup;
}


/**
 * Remove a subscription (hub) to receive Events
 *
 * id String Identifier of the Resource
 * no response value expected for this operation
 **/
exports.hubDelete = function(req, id) {
  console.log('[HUB] hubDelete called with id:', id);
  console.log('[HUB] req.url:', req.url);
  
  return new Promise((resolve, reject) => {
    if (!id) {
      return reject({
        code: 400,
        message: "Missing hub ID"
      });
    }

    const mongoUtils = require('../utils/mongoUtils');
    const HUB = "HUB";

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req) // Extract from request URL
    };

    console.log(`[HUB] Unregistering listener with ID: ${id} and serviceGroup: ${query._serviceGroup}`);

    mongoUtils.connect().then(db => {
      db.collection(HUB)
      .deleteOne(query)
      .then(doc => {
        if (doc.deletedCount === 1) {
          console.log(`[HUB] Successfully unregistered listener with ID: ${id}`);
          resolve(); // No content for 204 response
        } else { 
          console.log(`[HUB] No listener found with ID: ${id}`);
          reject({
            code: 404,
            message: "No resource with given id found"
          });
        }
      }).catch(error => {
        console.error("[HUB] Error unregistering listener: " + error);
        reject({
          code: 500,
          message: "Database error"
        });
      });
    })
    .catch(error => {
      console.error("[HUB] Database connection error: " + error);
      reject({
        code: 500,
        message: "Database error"
      });
    });
  });
}


/**
 * Retrieve a subscription (hub)
 *
 * id String Identifier of the Resource
 * returns Hub
 **/
exports.hubGet = function(req, id) {
  console.log('[HUB] hubGet called with id:', id);
  console.log('[HUB] req.url:', req.url);
  
  return new Promise((resolve, reject) => {
    if (!id) {
      return reject({
        code: 400,
        message: "Missing hub ID"
      });
    }

    const mongoUtils = require('../utils/mongoUtils');
    const HUB = "HUB";

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req) // Extract from request URL
    };

    console.log(`[HUB] Retrieving listener with ID: ${id} and serviceGroup: ${query._serviceGroup}`);

    mongoUtils.connect().then(db => {
      db.collection(HUB)
        .findOne(query)
        .then(doc => {
          if(doc) {
            // Clean the response (remove internal fields)
            const response = Object.assign({}, doc);
            Object.keys(response).forEach(key => {
              if (key.startsWith("_")) {
                delete response[key];
              }
            });
            
            console.log(`[HUB] Found listener with ID: ${id}`);
            resolve(response);
          } else {
            console.log(`[HUB] No listener found with ID: ${id}`);
            reject({
              code: 404,
              message: "No resource with given id found"
            });
          }
        })
        .catch(error => {
          console.error("[HUB] Error retrieving listener: " + error);
          reject({
            code: 500,
            message: "Database error"
          });
        });
    })
    .catch(error => {
      console.error("[HUB] Database connection error: " + error);
      reject({
        code: 500,
        message: "Database error"
      });
    });
  });
}

