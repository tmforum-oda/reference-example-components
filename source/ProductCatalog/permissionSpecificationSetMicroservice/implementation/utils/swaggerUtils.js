'use strict';

function getPayload(req) {
  return new Promise(function(resolve, reject) {
    if (req.body) {
      resolve(req.body);
    } else {
      reject(new Error("No payload"));
    }
  });
}

function getPayloadType(req) {
  const regex = /.*\/api\/(.*?)\/[0-9]*/;
  try {
    return req.swagger.operation.tags[0];
  } catch(err) {
    return req.url.match(regex)[1];
  }
}

function getPayloadSchema(req) {
  return req.swagger.operation.parameters.find(param => param.in === 'body');
}

function getResponseType(req) {
  return req.swagger.operation.tags[0];
}

function getTypeDefinition(type) {
  try {
    return swagger.definitions[type];
  }
  catch(err) {
    return {};
  }
}

module.exports = {
  getPayload,
  getPayloadType,
  getPayloadSchema, 
  getResponseType,
  getTypeDefinition
};