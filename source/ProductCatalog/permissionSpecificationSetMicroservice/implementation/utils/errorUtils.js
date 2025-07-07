'use strict';

const TErrorEnum = {
  INTERNAL_SERVER_ERROR: { "code": "500", "message": "Internal Server Error" },
  RESOURCE_NOT_FOUND: { "code": "404", "message": "Resource not found" },
  INVALID_REQUEST: { "code": "400", "message": "Invalid Request" },
  INVALID_BODY: { "code": "400", "message": "Invalid Body" }
};

class TError extends Error {
  constructor(errorEnum, message) {
    super(message);
    this.name = 'TError';
    this.code = errorEnum.code;
    this.status = parseInt(errorEnum.code);
    this.message = message || errorEnum.message;
  }
}

function sendError(res, error) {
  console.error('Error occurred:', error);
  
  const statusCode = error.status || error.code || 500;
  const errorResponse = {
    code: error.code || '500',
    message: error.message || 'Internal Server Error'
  };
  
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(errorResponse));
}

module.exports = { TError, TErrorEnum, sendError };