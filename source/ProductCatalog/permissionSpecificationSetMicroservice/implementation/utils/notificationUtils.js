'use strict';

const uuid = require('uuid');
const { transform, isEqual, isObject, isArray } = require('lodash');

const mongoUtils = require('./mongoUtils');

const HUB = "HUB";

function publish(req, doc, old) {
  const method = req.method; // POST, GET etc
  
  // For PermissionSpecificationSet, use static resource type
  const resourceType = "PermissionSpecificationSet";

  const message = createEventMessage(resourceType, method, doc, old);

  console.log(`[NOTIFICATION] Publishing event: ${message.eventType} for resource: ${resourceType}`);
  console.log(`[NOTIFICATION] Event ID: ${message.eventId}, Event Time: ${message.eventTime}`);
  console.log(`[NOTIFICATION] Event payload: ${JSON.stringify(message.event, null, 2)}`);

  const query = {
    _serviceGroup: getServiceGroup(req)
  };
    
  console.log(`[HUB] Searching for subscribers with serviceGroup: ${query._serviceGroup}`);
  
  // Debug: List all hub registrations to see what's actually stored
  mongoUtils.connect()
  .then(debugDb => {
    debugDb.collection(HUB)
    .find({}).toArray()
    .then(allHubEntries => {
      console.log(`[HUB] DEBUG: Total hub registrations in database: ${allHubEntries.length}`);
      allHubEntries.forEach((entry, index) => {
        console.log(`[HUB] DEBUG: Registration ${index + 1}: serviceGroup="${entry._serviceGroup}", callback="${entry.callback}", id="${entry.id}"`);
      });
    })
    .catch(error => console.error("[HUB] DEBUG: Error listing all hub entries: " + error));
  })
  .catch(error => console.error("[HUB] DEBUG: Database connection error: " + error));
  
  // Find subscribers for the serviceGroup
  mongoUtils.connect()
  .then(db => {
    db.collection(HUB)
    .find(query).toArray()
    .then(clients => {
      console.log(`[HUB] Found ${clients.length} registered listeners/subscribers:`);
      clients.forEach((client, index) => {
        console.log(`[HUB] Listener ${index + 1}: Callback URL: ${client.callback}, ID: ${client.id}, Query: ${client._query || 'none'}`);
      });
      
      if (clients.length === 0) {
        console.log(`[HUB] No listeners found for serviceGroup: ${query._serviceGroup}. Event will not be delivered.`);
      }
      
      notify(db, clients, message);
    })
    .catch(error => console.error("[HUB] Error finding subscribers: " + error))
  })
  .catch(error => console.error("[HUB] Database connection error: " + error));
}

function notify(db, clients, message) {
  const EVENTS = "TMPEVENTS";
  
  console.log(`[NOTIFICATION] Starting notification process for ${clients.length} clients`);
  console.log(`[NOTIFICATION] Storing event in temporary collection: ${EVENTS}`);
  
  db.collection(EVENTS)
  .insertOne(message)
  .then(() => {
    console.log(`[NOTIFICATION] Event stored successfully with ID: ${message.eventId}`);
    
    const promises = clients.map((client, index) => {
      console.log(`[NOTIFICATION] Processing notification ${index + 1}/${clients.length} for client: ${client.callback}`);
      return processMessage(db, client, message);
    });

    const cleanup = function() {
      console.log(`[NOTIFICATION] Cleaning up temporary event: ${message.eventId}`);
      db.collection(EVENTS)
      .deleteOne(message)
      .then(() => {
        console.log(`[NOTIFICATION] Successfully cleaned up event: ${message.eventId}`);
      })
      .catch(err => console.error(`[NOTIFICATION] Clean-up error for event ${message.eventId}: ${err}`))
    };

    Promise.all(promises)
    .then((results) => {
      const successCount = results.filter(r => r !== undefined).length;
      console.log(`[NOTIFICATION] Notification process completed. Successful deliveries: ${successCount}/${clients.length}`);
      cleanup();
    })
    .catch(err => {
      console.error(`[NOTIFICATION] Error during notification process: ${err}`);
      cleanup();
    });

  })
  .catch(err => console.error(`[NOTIFICATION] Error storing event in ${EVENTS}: ${err}`));
}

function processMessage(db, client, message) {
  const rp = require('request-promise');

  console.log(`[NOTIFICATION] Processing message for client: ${client.callback}`);
  console.log(`[NOTIFICATION] Client query filter: ${client._query || 'none'}`);

  return new Promise(function(resolve, reject) {
    var query = JSON.parse(client._query);

    if(query !== undefined && query.criteria !== undefined) {
      query.criteria = {'eventId': message.eventId};
    }

    const EVENTS = "TMPEVENTS";
    var eventsCollection = db.collection(EVENTS)
    
    console.log(`[NOTIFICATION] Querying ${EVENTS} collection with criteria: ${JSON.stringify(query.criteria)}`);
    
    eventsCollection
    .findOne(query.criteria, query.options)
    .then(doc => clean(doc))
    .then(doc => {
      if(doc === undefined || doc === null) {
        console.log(`[NOTIFICATION] No matching event found for client ${client.callback} with query ${JSON.stringify(query.criteria)}`);
        return reject();
      }
      
      console.log(`[NOTIFICATION] Sending POST request to: ${client.callback}`);
      console.log(`[NOTIFICATION] Payload size: ${JSON.stringify(doc).length} characters`);
      console.log(`[NOTIFICATION] Payload preview: ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
      
      const startTime = Date.now();
      
      rp({uri: client.callback, method: "POST", body: doc, json: true})
      .then((response) => {
        const duration = Date.now() - startTime;
        console.log(`[NOTIFICATION] ✅ Successfully sent notification to ${client.callback} (${duration}ms)`);
        console.log(`[NOTIFICATION] Response: ${JSON.stringify(response).substring(0, 100)}...`);
        resolve(response);
      })
      .catch(err => {
        const duration = Date.now() - startTime;
        console.error(`[NOTIFICATION] ❌ Failed to send notification to ${client.callback} (${duration}ms): ${err.message || err}`);
        console.error(`[NOTIFICATION] Error details: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      });
    })
    .catch(err => {
      console.error(`[NOTIFICATION] Error querying events collection for client ${client.callback}: ${err}`);
      return reject(err);
    });
  });
}

function clean(doc) {
  var res = undefined;
  if(doc !== undefined) {
    if(isArray(doc)) {
      res = [];
      doc.forEach( x => res.push(clean(x)));
    } else if (isObject(doc)) {
      res = copy(doc);
      Object.keys(res).forEach(key => {
        if(key.startsWith("_")) {
          delete res[key];
        }
      });
    }
  };
  return res;
}

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

function copy(doc) {
  return JSON.parse(JSON.stringify(doc));
}

function createEventMessage(resourceType, operation, doc, old) {
  var eventType = resourceType; 

  if(operation === "POST") {
    eventType = eventType + "Creation";
  } else if(operation === "DELETE") {
    eventType = eventType + "Remove";
  } else if(operation === "PUT" || operation === "PATCH") {
    var change = "AttributeValueChange"; 
    if(old !== undefined) {
      const diff = difference(doc, old);
      console.log(`[NOTIFICATION] Change detection - diff: ${JSON.stringify(diff, null, 2)}`);
      if(diff.state !== undefined || diff.status !== undefined) {
        change = "StateChange";
        console.log(`[NOTIFICATION] State change detected in fields: ${Object.keys(diff).join(', ')}`);
      }
    }
    eventType = eventType + change; 
  }
  eventType = eventType + "Notification";

  var message = {
    eventId: uuid.v4(),
    eventTime: (new Date()).toISOString(),
    eventType: eventType,
    event: {}
  };
  const entity = resourceType.replace(/^\w/, c => c.toLowerCase());
  message.event[entity] = doc;

  console.log(`[NOTIFICATION] Created event message - Type: ${eventType}, ID: ${message.eventId}`);
  
  return message;
}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(object, base) {
  return transform(object, (result, value, key) => {
    if (!isEqual(value, base[key])) {
      result[key] = isObject(value) && isObject(base[key]) ? difference(value, base[key]) : value;
    }
  });
}

function register(req, res, next) {
  console.log('[HUB] register :: ' + req.method + ' ' + req.url + ' ' + (req.headers ? req.headers.host : 'unknown-host'));
  
  const { sendDoc } = require('./mongoUtils');
  const { TError, TErrorEnum, sendError } = require('./errorUtils');
  
  // Get the request body (hub registration data) - try req.body first
  let payload = req.body;
  
  if (!payload) {
    console.log('[HUB] req.body is empty, rejecting request');
    return sendError(res, new TError(TErrorEnum.INVALID_BODY, "Missing hub registration data"));
  }

  console.log('[HUB] Processing payload:', JSON.stringify(payload, null, 2));

  // Add required fields
  payload.id = uuid.v4();
  payload._serviceGroup = getServiceGroup(req);
  
  // Set default query if not provided
  if (!payload.query) {
    payload.query = "";
  }
  
  // Generate _query field for MongoDB query
  try {
    const query = mongoUtils.getMongoQuery(payload.query); 
    payload._query = JSON.stringify(query);
  } catch(err) {
    console.error("notificationUtils::register: error=" + err);
    return sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process query"));
  }

  console.log(`[HUB] Registering listener with serviceGroup: ${payload._serviceGroup}`);
  console.log(`[HUB] Callback URL: ${payload.callback}`);
  console.log(`[HUB] Query filter: ${payload.query || 'none'}`);

  mongoUtils.connect().then(db => {
    db.collection(HUB)
      .insertOne(payload)
      .then(() => {
        console.log(`[HUB] Successfully registered listener with ID: ${payload.id}`);
        const response = clean(copy(payload));
        sendDoc(res, 201, response);
      })
      .catch((error) => {
        console.error("[HUB] Error registering listener: " + error);
        sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
      });
  })
  .catch((error) => {
    console.error("[HUB] Database connection error: " + error);
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
  });
}

function unregister(req, res, next) {
  console.log('[HUB] unregister :: ' + req.method + ' ' + req.url + ' ' + (req.headers ? req.headers.host : 'unknown-host'));

  const { sendDoc } = require('./mongoUtils');
  const { TError, TErrorEnum, sendError } = require('./errorUtils');

  try {
    const key = Object.keys(req.swagger.params)[0];
    const id = String(req.swagger.params[key].value);

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req)
    };

    console.log(`[HUB] Unregistering listener with ID: ${id}`);

    mongoUtils.connect().then(db => {
      db.collection(HUB)
      .deleteOne(query)
      .then(doc => {
        if (doc.result.n == 1) {
          console.log(`[HUB] Successfully unregistered listener with ID: ${id}`);
          sendDoc(res, 204, {});
        } else { 
          console.log(`[HUB] No listener found with ID: ${id}`);
          sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"unregister: No resource with given id: " + id + " found"));
        }
      }).catch(error => {
        console.error("[HUB] Error unregistering listener: " + error);
        sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
      });
    })
    .catch(error => {
      console.error("[HUB] Database connection error: " + error);
      sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
    });

  } catch(err) {
    console.error("[HUB] Parameter processing error: " + err);
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Parameter processing error"));
  }
}

function show(req, res, next) {
  console.log('[HUB] show :: ' + req.method + ' ' + req.url + ' ' + (req.headers ? req.headers.host : 'unknown-host'));

  const { sendDoc } = require('./mongoUtils');
  const { TError, TErrorEnum, sendError } = require('./errorUtils');

  try {
    const key = Object.keys(req.swagger.params)[0];
    const id = String(req.swagger.params[key].value);

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req)
    };

    console.log(`[HUB] Retrieving listener with ID: ${id}`);

    mongoUtils.connect().then(db => {
      db.collection(HUB)
        .findOne(query)
        .then(doc => {
          if(doc) {
            const response = clean(doc);
            console.log(`[HUB] Found listener with ID: ${id}`);
            sendDoc(res, 200, response);
          } else {
            console.log(`[HUB] No listener found with ID: ${id}`);
            sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"show: No resource with given id found"));
          }
        })
        .catch(error => {
          console.error("[HUB] Error retrieving listener: " + error);
          sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
        });
    })
    .catch(error => {
      console.error("[HUB] Database connection error: " + error);
      sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
    });

  } catch(err) {
    console.error("[HUB] Parameter processing error: " + err);
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Parameter processing error"));
  }
}

module.exports = { publish, register, unregister, show };
