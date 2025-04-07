'use strict';


/**
 * Creates a PermissionSpecificationSet
 * This operation creates a PermissionSpecificationSet entity.
 *
 * body PermissionSpecificationSet_FVO The PermissionSpecificationSet to be created
 * fields String Comma-separated properties to be provided in response (optional)
 * returns PermissionSpecificationSet_RES
 **/
exports.createPermissionSpecificationSet = function(body,fields) {
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
 * Deletes a PermissionSpecificationSet
 * This operation deletes a PermissionSpecificationSet entity.
 *
 * id String Identifier of the Resource
 * no response value expected for this operation
 **/
exports.deletePermissionSpecificationSet = function(id) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * List or find PermissionSpecificationSet objects
 * List or find PermissionSpecificationSet objects
 *
 * fields String Comma-separated properties to be provided in response (optional)
 * offset Integer Requested index for start of resources to be provided in response (optional)
 * limit Integer Requested number of resources to be provided in response (optional)
 * before String An opaque string value representing the page results before the cursor value (optional)
 * after String An opaque string value representing the page results after the cursor value (optional)
 * sort String The default direction is Ascending order, the use of the modifier in front of the sort field name, “-“, changes the sort order direction. (optional)
 * filter String Filter a collection using JSONPath (optional)
 * returns List
 **/
exports.listPermissionSpecificationSet = function(fields,offset,limit,before,after,sort,filter) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ "", "" ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Updates partially a PermissionSpecificationSet
 * This operation updates partially a PermissionSpecificationSet entity.
 *
 * body PermissionSpecificationSet_MVO The PermissionSpecificationSet to be patched
 * fields String Comma-separated properties to be provided in response (optional)
 * id String Identifier of the Resource
 * returns PermissionSpecificationSet_RES
 **/
exports.patchPermissionSpecificationSet = function(body,fields,id) {
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
 * Updates partially a PermissionSpecificationSet
 * This operation updates partially a PermissionSpecificationSet entity.
 *
 * body PermissionSpecificationSet_MVO The PermissionSpecificationSet to be patched
 * fields String Comma-separated properties to be provided in response (optional)
 * id String Identifier of the Resource
 * returns PermissionSpecificationSet_RES
 **/
exports.patchPermissionSpecificationSet = function(body,fields,id) {
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
 * Retrieves a PermissionSpecificationSet by ID
 * This operation retrieves a PermissionSpecificationSet entity. Attribute selection enabled for all first level attributes.
 *
 * id String Identifier of the Resource
 * fields String Comma-separated properties to be provided in response (optional)
 * returns PermissionSpecificationSet_RES
 **/
exports.retrievePermissionSpecificationSet = function(id,fields) {
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

