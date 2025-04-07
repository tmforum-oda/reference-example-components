'use strict';


/**
 * Create a subscription (hub) to receive Events
 * Sets the communication endpoint to receive Events.
 *
 * body Hub_FVO Data containing the callback endpoint to deliver the information
 * returns Hub
 **/
exports.createHub = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Remove a subscription (hub) to receive Events
 *
 * id String Identifier of the Resource
 * no response value expected for this operation
 **/
exports.hubDelete = function(id) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Retrieve a subscription (hub)
 *
 * id String Identifier of the Resource
 * returns Hub
 **/
exports.hubGet = function(id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

