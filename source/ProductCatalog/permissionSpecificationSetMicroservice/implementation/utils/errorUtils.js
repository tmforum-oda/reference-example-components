'use strict';

const TErrorEnum = {
  INTERNAL_SERVER_ERROR: { "code": "500", "message": "Internal Server Error" },
  RESOURCE_NOT_FOUND: { "code": "404", "message": "Resource not found" },
  INVALID_REQUEST: { "code": "400", "message": "Invalid Request" }
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
  console.error('Res: ', res);
  res.statusCode = error.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    code: error.code,
    message: error.message
  }));
}

module.exports = { TError, TErrorEnum, sendError };